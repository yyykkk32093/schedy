// test/e2e/signup_to_audit.test.ts

import { prisma } from "@/_sharedTech/db/client.js";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "./serverForTest.js";

const describeE2E = process.env.DATABASE_URL
    ? describe.sequential
    : describe.skip;

describeE2E("Signup E2E", () => {
    beforeEach(async () => {
        await prisma.authAuditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});

        // User 関連（ユニーク制約衝突の回避）
        await prisma.passwordCredential.deleteMany({});
        await prisma.authSecurityState.deleteMany({});
        await prisma.user.deleteMany({});
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("Signup Success → User + Credential 作成（Outbox不使用）", async () => {
        const res = await request(app).post("/v1/users").send({
            email: "signup_test@example.com",
            password: "password123",
            displayName: "Signup Test",
        });

        expect(res.status).toBe(201);
        expect(typeof res.body?.userId).toBe("string");

        const userId = res.body.userId as string;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        expect(user).not.toBeNull();

        const credential = await prisma.passwordCredential.findUnique({
            where: { userId },
        });
        expect(credential).not.toBeNull();

        // SignUp は Outbox を使わない（audit.log / user.lifecycle.audit 廃止済み）
        const pending = await prisma.outboxEvent.findMany({
            where: { status: "PENDING" },
        });
        expect(pending.length).toBe(0);
    });

    it("Signup Duplicate Email → 409 EMAIL_ALREADY_IN_USE", async () => {
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

        // 最初の signup でも Outbox イベントは 0 件
        const outboxAll = await prisma.outboxEvent.findMany({});
        expect(outboxAll.length).toBe(0);
    });
});
