// test/e2e/auth_to_audit.test.ts
// Auth → AuthAuditLog E2E
// ログイン成功/失敗時に TX 内で AuthAuditLog が直接 INSERT されることを検証

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

describeE2E('Auth → AuthAuditLog E2E', () => {
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

    // ① Worker は一度だけ生成すれば良い
    beforeAll(async () => {
        worker = OutboxWorkerTestRegistrar.createWorker(app);
    });

    // ② 各テスト前に DB をクリーンにして状態を独立させる
    beforeEach(async () => {
        await prisma.authAuditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});

        // User 関連（ユニーク制約衝突の回避）
        await prisma.passwordCredential.deleteMany({});
        await prisma.authSecurityState.deleteMany({});
        await prisma.user.deleteMany({});

        // Login Success/Failed の前提ユーザーを作成
        const signup = await request(app).post("/v1/users").send({
            email: "test@example.com",
            password: "password123",
            displayName: "Test",
        });
        expect(signup.status).toBe(201);

        // Signup由来のAuditは見ないのでクリア
        await prisma.authAuditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("Login Success → AuthAuditLog が TX 内で直接記録される", async () => {
        const res = await request(app)
            .post("/v1/auth/password")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(200);

        // Outbox は不要（TX 内 INSERT のためワーカー不要）
        const logs = await prisma.authAuditLog.findMany();
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe("LOGIN_SUCCESS");
        expect(logs[0].userId).toBeTruthy();
    });

    it("Login Failed → AuthAuditLog が TX 内で直接記録される", async () => {
        const res = await request(app)
            .post("/v1/auth/password")
            .send({ email: "test@example.com", password: "wrongpass" });

        expect(res.status).toBe(401);

        // Outbox は不要（TX 内 INSERT のためワーカー不要）
        const logs = await prisma.authAuditLog.findMany();
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe("LOGIN_FAILED");
        expect(logs[0].userId).toBeTruthy();
    });

    it("Retry 上限に達したら FAILED になる（DLQ 落ち — Outbox 汎用テスト）", async () => {

        // ★ fail handler を DI に注入しながら Worker を作る
        worker = OutboxWorkerTestRegistrar.createWorker(app, (dispatcher) => {
            dispatcher.register("test.fail.handler", new TestFailHandler());
        });

        await ensureRetryPolicy({
            routingKey: "test.fail.handler",
            baseInterval: 1,
            maxInterval: 5,
            maxRetries: 3,
        });

        await prisma.outboxEvent.create({
            data: {
                id: "test-ev-001",
                idempotencyKey: "test-ev-001:test.fail.handler:test.failed",
                aggregateId: "u001",
                eventName: "TestEvent",
                eventType: "test.failed",
                routingKey: "test.fail.handler",
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
