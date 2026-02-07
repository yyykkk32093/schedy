// test/e2e/serverForTest.ts
import { ApplicationEventBootstrap } from "@/_bootstrap/ApplicationEventBootstrap.js";
import { AppSecretsLoader } from "@/_sharedTech/config/AppSecretsLoader.js";
import { logger } from "@/_sharedTech/logger/logger.js";
import { usecaseFactory } from "@/api/_usecaseFactory.js";
import { errorHandler } from "@/api/middleware/errorHandler.js";
import { IntegrationDispatcher } from "@/integration/dispatcher/IntegrationDispatcher.js";
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { loadConfig, register } from "tsconfig-paths";
import { fileURLToPath, pathToFileURL } from "url";
import { EventTestRegistrar } from "./eventSubscribersRegistrarForTest.js";
import { FakeOAuthProviderRegistry } from "./FakeOAuthProviderClient.js";

logger.info("TEST LOGGER DIRECT CALL");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* 1. tsconfig-paths */
const projectRoot = path.resolve(__dirname, "../..");
const tsConfig = loadConfig(projectRoot);

if (tsConfig.resultType === "success") {
    register({
        baseUrl: tsConfig.absoluteBaseUrl,
        paths: tsConfig.paths,
    });
}

/* 2. express 初期化 */
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* 3. IntegrationDispatcher（共有 DI）を app に登録 */
const dispatcher = new IntegrationDispatcher();
app.set("integrationDispatcher", dispatcher);

/* 3.5 App Secrets をテスト用ダミー値でセット（Secrets Manager は使わない） */
AppSecretsLoader.setCache({
    oauth: {
        google: {
            clientId: "test-google-client-id",
            clientSecret: "test-google-client-secret",
            redirectUri: "http://localhost:5173/auth/callback/google",
        },
        line: {
            channelId: "test-line-channel-id",
            channelSecret: "test-line-channel-secret",
            redirectUri: "http://localhost:5173/auth/callback/line",
        },
        apple: {
            clientId: "test-apple-client-id",
            teamId: "test-apple-team-id",
            keyId: "test-apple-key-id",
            privateKey: "test-apple-private-key",
            redirectUri: "http://localhost:5173/auth/callback/apple",
        },
    },
    database: {
        url: process.env.DATABASE_URL ?? "",
    },
});

/* 3.6 Fake OAuthProviderClient を usecaseFactory に注入 */
const fakeOAuthRegistry = FakeOAuthProviderRegistry.getInstance();
usecaseFactory.setOAuthProviderClients(fakeOAuthRegistry.getProviderClients());

/* 4. src/api の Routes をすべて読み込む */
const apiRoot = path.resolve(__dirname, "../../src/api");

async function loadRoutes(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await loadRoutes(fullPath);
            continue;
        }

        if (entry.isFile() && entry.name.endsWith("Routes.ts")) {
            const mod = await import(pathToFileURL(fullPath).href);
            if (mod.default) {
                app.use("/", mod.default);
            }
        }
    }
}

await loadRoutes(apiRoot);

/* 5. テスト用 DomainEvent + Integration の購読者登録 */
// 🔔 Application Event 初期化（本番と同じ）
ApplicationEventBootstrap.bootstrap()

// テスト用 Subscriber / Integration 登録
EventTestRegistrar.registerAll(app)

/* 7. error handler */
app.use(errorHandler)

/* 6. 本番の DomainEventRegistrar は絶対に呼ばない */
export default app;
/** テスト用にFakeOAuthProviderRegistryをエクスポート */
export { fakeOAuthRegistry };
