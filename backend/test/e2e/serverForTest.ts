// test/e2e/serverForTest.ts
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { loadConfig, register } from "tsconfig-paths";
import { fileURLToPath, pathToFileURL } from "url";

import { IntegrationDispatcher } from "@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js";
import { logger } from "@/sharedTech/logger/logger.js";
import { DomainEventTestRegistrar } from "./eventSubscribersRegistrarForTest.js";

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
DomainEventTestRegistrar.registerAll(app);

/* 6. 本番の DomainEventRegistrar は絶対に呼ばない */
export default app;
