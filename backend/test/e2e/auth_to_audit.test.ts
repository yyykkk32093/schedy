// test/e2e/auth_to_audit.test.ts

import { prisma } from "@/_sharedTech/db/client.js";
import type { OutboxWorker } from "@/job/outbox/outboxWorker.js";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TestFailHandler } from "./handlers/TestFailHandler.js";
import { OutboxWorkerTestRegistrar } from "./OutboxWorkerTestRegistrar.js";
import app from "./serverForTest.js";

const describeE2E = process.env.DATABASE_URL
    ? describe.sequential
    : describe.skip;

describeE2E('Auth → Outbox → AuditLog E2E', () => {
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
        console.log(
            `[DEBUG] ${label} outbox:${outbox.length} audit:${audit.length}`
        );
        // console.log(
        //     "[DEBUG] outbox sample:",
        //     util.inspect(outbox.slice(0, 3), { depth: 4 })
        // );
        // console.log(
        //     "[DEBUG] audit sample:",
        //     util.inspect(audit.slice(0, 3), { depth: 4 })
        // );
    }

    // ① Worker は一度だけ生成すれば良い
    beforeAll(async () => {
        worker = OutboxWorkerTestRegistrar.createWorker(app);
    });

    // ② 各テスト前に DB をクリーンにして状態を独立させる
    beforeEach(async () => {
        await prisma.auditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});

        // User 関連（ユニーク制約衝突の回避）
        await prisma.passwordCredential.deleteMany({});
        await prisma.authSecurityState.deleteMany({});
        await prisma.user.deleteMany({});

        // E2Eで使う routingKey は seed と衝突し得るため upsert で安定化
        await ensureRetryPolicy({
            routingKey: "audit.log",
            baseInterval: 10,
            maxInterval: 1000,
            maxRetries: 3,
        });

        // Login Success/Failed の前提ユーザーを作成（Signup時のOutboxは後でクリア）
        const signup = await request(app).post("/v1/users").send({
            email: "test@example.com",
            password: "password123",
            displayName: "Test",
        });
        expect(signup.status).toBe(201);

        // Signup由来のOutbox/Auditはこのテストでは見ないのでクリア
        await prisma.auditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("Login Success → Outbox → AuditLog", async () => {
        const res = await request(app)
            .post("/v1/auth/password")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(200);

        await debugDump("after login success request");

        const pending = await prisma.outboxEvent.findMany({
            where: { status: "PENDING" },
        });
        expect(pending.length).toBe(1);

        await worker.runOnce();

        await debugDump("after worker.runOnce success");

        const logs = await prisma.auditLog.findMany();
        expect(logs.length).toBe(1);
        expect(logs[0].eventType).toBe("auth.login.success");
    });

    it("Login Failed → Outbox → AuditLog", async () => {
        const res = await request(app)
            .post("/v1/auth/password")
            .send({ email: "test@example.com", password: "wrongpass" });

        expect(res.status).toBe(401);

        await debugDump("after login failed request");

        const pending = await prisma.outboxEvent.findMany({
            where: { status: "PENDING" },
        });
        expect(pending.length).toBe(1);

        await worker.runOnce();

        await debugDump("after worker.runOnce failed");

        const logs = await prisma.auditLog.findMany();
        expect(logs.length).toBe(1);
        expect(logs[0].eventType).toBe("auth.login.failed");
    });

    it("Retry 上限に達したら FAILED になる（DLQ 落ち）", async () => {

        // ★ fail handler を DI に注入しながら Worker を作る
        worker = OutboxWorkerTestRegistrar.createWorker(app, (dispatcher) => {
            dispatcher.register("audit.log.fail", new TestFailHandler());
        });

        await ensureRetryPolicy({
            routingKey: "audit.log.fail",
            baseInterval: 1,
            maxInterval: 5,
            maxRetries: 3,
        });

        await prisma.outboxEvent.create({
            data: {
                id: "test-ev-001",
                idempotencyKey: "test-ev-001:audit.log.fail:test.failed",
                aggregateId: "u001",
                eventName: "TestEvent",
                eventType: "test.failed",
                routingKey: "audit.log.fail",
                payload: { foo: "bar" },
                occurredAt: new Date(),
                status: "PENDING",
                retryCount: 0,
                nextRetryAt: new Date(),
            },
        });

        // 3回実行 → DLQ 落ち
        await worker.runOnce();
        await worker.runOnce();
        await worker.runOnce();

        const event = await prisma.outboxEvent.findUnique({
            where: { id: "test-ev-001" },
        });

        expect(event?.status).toBe("FAILED");

        const dlq = await prisma.outboxDeadLetter.findMany();
        expect(dlq.length).toBe(1);
        expect(dlq[0].outboxEventId).toBe("test-ev-001");
    });

});
