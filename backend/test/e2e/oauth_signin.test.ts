// test/e2e/oauth_signin.test.ts

import { prisma } from "@/_sharedTech/db/client.js";
import type { OutboxWorker } from "@/job/outbox/outboxWorker.js";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { OutboxWorkerTestRegistrar } from "./OutboxWorkerTestRegistrar.js";
import app, { fakeOAuthRegistry } from "./serverForTest.js";

const describeE2E = process.env.DATABASE_URL
    ? describe.sequential
    : describe.skip;

describeE2E("OAuth SignIn E2E", () => {
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

    beforeAll(async () => {
        worker = OutboxWorkerTestRegistrar.createWorker(app);
    });

    beforeEach(async () => {
        // クリーンアップ
        await prisma.auditLog.deleteMany({});
        await prisma.outboxEvent.deleteMany({});
        await prisma.outboxDeadLetter.deleteMany({});

        // User 関連（ユニーク制約衝突の回避）
        await prisma.googleCredential.deleteMany({});
        await prisma.lineCredential.deleteMany({});
        await prisma.appleCredential.deleteMany({});
        await prisma.passwordCredential.deleteMany({});
        await prisma.authSecurityState.deleteMany({});
        await prisma.user.deleteMany({});

        // FakeOAuthProviderの設定をクリア
        fakeOAuthRegistry.clearAll();

        // Retry Policyを設定
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

    // ========================================
    // Google OAuth
    // ========================================
    describe("Google OAuth", () => {
        it("初回signin → User作成 → JWT返却 → AuditLog記録", async () => {
            // FakeOAuthProviderに返すプロフィールを設定
            fakeOAuthRegistry.google.setProfile("valid-google-code-001", {
                provider: "google",
                providerUserId: "google-uid-12345",
                email: "google-user@example.com",
                displayName: "Google User",
            });

            const res = await request(app)
                .post("/v1/auth/oauth/google")
                .send({
                    code: "valid-google-code-001",
                });

            expect(res.status).toBe(200);
            expect(typeof res.body?.userId).toBe("string");
            expect(typeof res.body?.accessToken).toBe("string");

            const userId = res.body.userId as string;

            // User が作成されていることを確認
            const user = await prisma.user.findUnique({ where: { id: userId } });
            expect(user).not.toBeNull();
            expect(user?.email).toBe("google-user@example.com");

            // GoogleCredential がリンクされていることを確認
            const credential = await prisma.googleCredential.findUnique({
                where: { userId },
            });
            expect(credential).not.toBeNull();
            expect(credential?.googleUid).toBe("google-uid-12345");

            // Outbox にイベントが作成されていることを確認
            const pending = await prisma.outboxEvent.findMany({
                where: { status: "PENDING" },
            });
            // UserLoginSucceededEvent → audit.log, UserRegisteredEvent fan-out
            expect(pending.length).toBeGreaterThanOrEqual(1);

            // Worker を実行して AuditLog に記録
            await worker.runOnce();

            const logs = await prisma.auditLog.findMany({
                where: { userId },
            });
            expect(logs.length).toBeGreaterThanOrEqual(1);
        });

        it("2回目signin → 既存User認証 → JWT返却", async () => {
            // 初回signin
            fakeOAuthRegistry.google.setProfile("valid-google-code-002", {
                provider: "google",
                providerUserId: "google-uid-22222",
                email: "existing-google@example.com",
                displayName: "Existing Google User",
            });

            const firstRes = await request(app)
                .post("/v1/auth/oauth/google")
                .send({ code: "valid-google-code-002" });

            expect(firstRes.status).toBe(200);
            const userId = firstRes.body.userId as string;

            // 2回目signin（同じgoogleUidで別のcode）
            fakeOAuthRegistry.google.setProfile("valid-google-code-003", {
                provider: "google",
                providerUserId: "google-uid-22222", // 同じUID
                email: "existing-google@example.com",
                displayName: "Existing Google User",
            });

            const secondRes = await request(app)
                .post("/v1/auth/oauth/google")
                .send({ code: "valid-google-code-003" });

            expect(secondRes.status).toBe(200);
            expect(secondRes.body.userId).toBe(userId); // 同じユーザー
            expect(typeof secondRes.body.accessToken).toBe("string");

            // User数が増えていないことを確認
            const users = await prisma.user.findMany({
                where: { email: "existing-google@example.com" },
            });
            expect(users.length).toBe(1);
        });

        it("email衝突 → 409 ACCOUNT_LINK_REQUIRED", async () => {
            // まずパスワードユーザーを作成
            const signupRes = await request(app)
                .post("/v1/users")
                .send({
                    email: "conflict@example.com",
                    password: "password123",
                    displayName: "Password User",
                });
            expect(signupRes.status).toBe(201);

            // 同じemailでGoogle OAuth signin を試みる
            fakeOAuthRegistry.google.setProfile("valid-google-code-conflict", {
                provider: "google",
                providerUserId: "google-uid-conflict",
                email: "conflict@example.com", // 衝突するemail
                displayName: "Google Conflict User",
            });

            const oauthRes = await request(app)
                .post("/v1/auth/oauth/google")
                .send({ code: "valid-google-code-conflict" });

            expect(oauthRes.status).toBe(409);
            expect(oauthRes.body?.code).toBe("ACCOUNT_LINK_REQUIRED");
        });

        it("IdP認証失敗 → 401 OAUTH_AUTHENTICATION_FAILED", async () => {
            // Fakeがエラーをスローするよう設定
            fakeOAuthRegistry.google.setError(
                "invalid-code",
                new Error("Invalid authorization code")
            );

            const res = await request(app)
                .post("/v1/auth/oauth/google")
                .send({ code: "invalid-code" });

            expect(res.status).toBe(401);
            expect(res.body?.code).toBe("OAUTH_AUTHENTICATION_FAILED");
        });
    });

    // ========================================
    // LINE OAuth
    // ========================================
    describe("LINE OAuth", () => {
        it("初回signin → User作成 → JWT返却", async () => {
            fakeOAuthRegistry.line.setProfile("valid-line-code-001", {
                provider: "line",
                providerUserId: "line-uid-12345",
                email: "line-user@example.com",
                displayName: "LINE User",
            });

            const res = await request(app)
                .post("/v1/auth/oauth/line")
                .send({ code: "valid-line-code-001" });

            expect(res.status).toBe(200);
            expect(typeof res.body?.userId).toBe("string");
            expect(typeof res.body?.accessToken).toBe("string");

            const userId = res.body.userId as string;

            // LineCredential がリンクされていることを確認
            const credential = await prisma.lineCredential.findUnique({
                where: { userId },
            });
            expect(credential).not.toBeNull();
            expect(credential?.lineUid).toBe("line-uid-12345");
        });

        it("emailなしsignin → User作成（email=null）", async () => {
            fakeOAuthRegistry.line.setProfile("valid-line-code-no-email", {
                provider: "line",
                providerUserId: "line-uid-no-email",
                email: null, // LINEはemailがない場合がある
                displayName: "LINE User No Email",
            });

            const res = await request(app)
                .post("/v1/auth/oauth/line")
                .send({ code: "valid-line-code-no-email" });

            expect(res.status).toBe(200);

            const userId = res.body.userId as string;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            expect(user).not.toBeNull();
            expect(user?.email).toBeNull();
        });
    });

    // ========================================
    // Apple OAuth
    // ========================================
    describe("Apple OAuth", () => {
        it("初回signin → User作成 → JWT返却", async () => {
            fakeOAuthRegistry.apple.setProfile("valid-apple-code-001", {
                provider: "apple",
                providerUserId: "apple-uid-12345",
                email: "apple-user@example.com",
                displayName: "Apple User",
            });

            const res = await request(app)
                .post("/v1/auth/oauth/apple")
                .send({ code: "valid-apple-code-001" });

            expect(res.status).toBe(200);
            expect(typeof res.body?.userId).toBe("string");
            expect(typeof res.body?.accessToken).toBe("string");

            const userId = res.body.userId as string;

            // AppleCredential がリンクされていることを確認
            const credential = await prisma.appleCredential.findUnique({
                where: { userId },
            });
            expect(credential).not.toBeNull();
            expect(credential?.appleUid).toBe("apple-uid-12345");
        });

        it("Private Relay Email → User作成", async () => {
            fakeOAuthRegistry.apple.setProfile("valid-apple-relay-code", {
                provider: "apple",
                providerUserId: "apple-uid-relay",
                email: "abcd1234@privaterelay.appleid.com", // Private Relay
                displayName: null, // Appleは初回以降displayNameを返さないことがある
            });

            const res = await request(app)
                .post("/v1/auth/oauth/apple")
                .send({ code: "valid-apple-relay-code" });

            expect(res.status).toBe(200);

            const userId = res.body.userId as string;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            expect(user).not.toBeNull();
            expect(user?.email).toBe("abcd1234@privaterelay.appleid.com");
        });
    });

    // ========================================
    // エラーケース
    // ========================================
    describe("Error Cases", () => {
        it("未サポートプロバイダ → 400", async () => {
            const res = await request(app)
                .post("/v1/auth/oauth/twitter")
                .send({ code: "some-code" });

            expect(res.status).toBe(400);
            expect(res.body?.message).toBe("unsupported provider");
        });

        it("codeなし → 400", async () => {
            const res = await request(app)
                .post("/v1/auth/oauth/google")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body?.message).toBe("code is required");
        });
    });
});
