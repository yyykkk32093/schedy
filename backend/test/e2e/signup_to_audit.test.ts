// test/e2e/signup_to_audit.test.ts

import { prisma } from "@/_sharedTech/db/client.js";
import type { OutboxWorker } from "@/job/outbox/outboxWorker.js";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { OutboxWorkerTestRegistrar } from "./OutboxWorkerTestRegistrar.js";
import { TestFailHandler } from "./handlers/TestFailHandler.js";
import app from "./serverForTest.js";

const describeE2E = process.env.DATABASE_URL
    ? describe.sequential
    : describe.skip;

describeE2E("Signup → Outbox → AuditLog E2E", () => {
    let worker: OutboxWorker;

    async function ensureRetryPolicy(params: {
        routingKey: string;
        baseInterval: number;
        maxInterval: number;
        maxRetries: number;
    }) {
        await prisma.outboxRetryPolicy.upsert({
            where: { routingKey: params.routingKey },
            update: {
                baseInterval: params.baseInterval,
                maxInterval: params.maxInterval,
                maxRetries: params.maxRetries,
            },
            create: {
                routingKey: params.routingKey,
                baseInterval: params.baseInterval,
                maxInterval: params.maxInterval,
                maxRetries: params.maxRetries,
            },
        });
    }

    async function debugDump(label: string) {
        const outbox = await prisma.outboxEvent.findMany({});
        const audit = await prisma.auditLog.findMany({});
        console.log(`[DEBUG] ${label} outbox:${outbox.length} audit:${audit.length}`);
    }

    beforeAll(async () => {
        worker = OutboxWorkerTestRegistrar.createWorker(app);
    });

    beforeEach(async () => {
        await prisma.auditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});

        // User 関連（ユニーク制約衝突の回避）
        await prisma.passwordCredential.deleteMany({});
        await prisma.authSecurityState.deleteMany({});
        await prisma.user.deleteMany({});

        // Signup(UserRegistered) は fan-out で2つ routingKey を生成するため両方のポリシーを用意
        // ※ DB seed と衝突し得るため upsert で確実に上書きする
        await ensureRetryPolicy({
            routingKey: "audit.log",
            baseInterval: 10,
            maxInterval: 1000,
            maxRetries: 3,
        });
        await ensureRetryPolicy({
            routingKey: "user.lifecycle.audit",
            baseInterval: 10,
            maxInterval: 1000,
            maxRetries: 3,
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("Signup Success → Outbox → AuditLog", async () => {
        const res = await request(app).post("/v1/users").send({
            email: "signup_test@example.com",
            password: "password123",
            displayName: "Signup Test",
        });

        expect(res.status).toBe(201);
        expect(typeof res.body?.userId).toBe("string");

        const userId = res.body.userId as string;

        await debugDump("after signup request");

        const user = await prisma.user.findUnique({ where: { id: userId } });
        expect(user).not.toBeNull();

        const credential = await prisma.passwordCredential.findUnique({
            where: { userId },
        });
        expect(credential).not.toBeNull();

        const pending = await prisma.outboxEvent.findMany({
            where: { status: "PENDING" },
            orderBy: { occurredAt: "asc" },
        });

        // UserRegisteredEvent は audit.log と user.lifecycle.audit に fan-out
        expect(pending.length).toBe(2);
        expect(new Set(pending.map((e) => e.eventType))).toEqual(
            new Set(["user.registered"])
        );
        expect(new Set(pending.map((e) => e.routingKey))).toEqual(
            new Set(["audit.log", "user.lifecycle.audit"])
        );

        await worker.runOnce();

        await debugDump("after worker.runOnce");

        const logs = await prisma.auditLog.findMany({
            where: { eventType: "user.registered" },
        });

        // fan-out した2配送先分が AuditLog に記録される想定
        expect(logs.length).toBe(2);
        expect(new Set(logs.map((l) => l.userId))).toEqual(new Set([userId]));
    });

    it("Signup Duplicate Email → 失敗（Outboxが増えない）", async () => {
        const email = "dup_signup@example.com";

        const first = await request(app).post("/v1/users").send({
            email,
            password: "password123",
            displayName: "First",
        });
        expect(first.status).toBe(201);

        const second = await request(app).post("/v1/users").send({
            email,
            password: "password123",
            displayName: "Second",
        });

        expect(second.status).toBe(409);
        expect(second.body?.code).toBe('EMAIL_ALREADY_IN_USE');

        const outboxAll = await prisma.outboxEvent.findMany({});
        expect(outboxAll.length).toBe(2);
    });

    it("Signup → fan-out片方が失敗 → リトライ上限でDLQ（片方は成功）", async () => {
        // ★ user.lifecycle.audit だけ fail handler へ差し替え
        worker = OutboxWorkerTestRegistrar.createWorker(app, (dispatcher) => {
            dispatcher.register("user.lifecycle.audit", new TestFailHandler());
        });

        // 即時リトライできるように delay を 0 に寄せる（base=1,max=1 → floor(0.5..1)=0）
        await ensureRetryPolicy({
            routingKey: "audit.log",
            baseInterval: 1,
            maxInterval: 1,
            maxRetries: 2,
        });
        await ensureRetryPolicy({
            routingKey: "user.lifecycle.audit",
            baseInterval: 1,
            maxInterval: 1,
            maxRetries: 2,
        });

        const res = await request(app).post("/v1/users").send({
            email: "partial_fail_signup@example.com",
            password: "password123",
            displayName: "Partial Fail",
        });
        expect(res.status).toBe(201);
        const userId = res.body.userId as string;

        const pending0 = await prisma.outboxEvent.findMany({
            where: { status: "PENDING" },
        });
        expect(pending0.length).toBe(2);

        // 1回目: audit.logは成功してPUBLISHED / user.lifecycle.auditは失敗してretryCount=1でPENDING
        await worker.runOnce();

        const publishedAfter1 = await prisma.outboxEvent.findMany({
            where: { status: "PUBLISHED" },
        });
        expect(publishedAfter1.length).toBe(1);

        // 2回目: user.lifecycle.audit が maxRetries 到達で FAILED & DLQ
        await worker.runOnce();

        const failed = await prisma.outboxEvent.findMany({
            where: { status: "FAILED" },
        });
        expect(failed.length).toBe(1);
        expect(failed[0].routingKey).toBe("user.lifecycle.audit");

        const dlq = await prisma.outboxDeadLetter.findMany({});
        expect(dlq.length).toBe(1);
        expect(dlq[0].routingKey).toBe("user.lifecycle.audit");

        // 成功した配送先分のみ AuditLog が作成される
        const logs = await prisma.auditLog.findMany({
            where: { eventType: "user.registered" },
        });
        expect(logs.length).toBe(1);
        expect(logs[0].userId).toBe(userId);
    });
});
