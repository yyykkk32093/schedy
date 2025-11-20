// src/server.ts

import cors from 'cors';
import dotenvFlow from 'dotenv-flow';
import express from 'express';
import fs from 'fs/promises';
import path, { dirname } from 'path';
import { loadConfig, register } from 'tsconfig-paths';
import { fileURLToPath, pathToFileURL } from 'url';
import util from 'util';

// ============================================================
// 🧭 ESM用 __dirname
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// 🌱 dotenv-flow 環境変数ロード
// backend/env を明確に指定
// ============================================================
dotenvFlow.config({
    path: path.resolve(__dirname, '../env'),
});
console.log('🌿 dotenv-flow loaded. NODE_ENV =', process.env.NODE_ENV);

// ============================================================
// 🧩 tsconfig-paths
// backend/tsconfig.json を厳密に参照する
// ============================================================
// const projectRoot = path.resolve(__dirname, '..'); // backend/
// const tsConfig = loadConfig(projectRoot);

const projectRoot = path.resolve(__dirname, '../..');
const tsConfig = loadConfig(projectRoot);

if (tsConfig.resultType === 'success') {
    register({
        baseUrl: tsConfig.absoluteBaseUrl,
        paths: tsConfig.paths,
    });
    console.log('✅ tsconfig-paths registered');
} else {
    console.warn('⚠️ tsconfig-paths failed:', tsConfig.message ?? '');
}

// ============================================================
// 🚀 Express 初期化
// ============================================================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🟡 Starting server boot sequence...');
const apiRoot = path.resolve(__dirname, '.');

// ============================================================
// 📦 ルート自動ロード
// ============================================================
const loadRoutes = async (dir: string) => {
    console.log(`📂 Loading routes from: ${dir}`);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await loadRoutes(fullPath);
            continue;
        }

        if (entry.isFile() && (entry.name.endsWith('Routes.js') || entry.name.endsWith('Routes.ts'))) {
            // if (entry.isFile() && entry.name.endsWith('Routes.ts')) {
            console.log(`📦 Importing route: ${fullPath}`);

            try {
                const routeModule = await import(pathToFileURL(fullPath).href);
                const router = routeModule.default;

                if (router) {
                    app.use('/', router);
                    console.log(`✅ Registered route: ${path.relative(apiRoot, fullPath)}`);
                } else {
                    console.warn(`⚠️ No default export found in ${entry.name}`);
                }
            } catch (err) {
                console.error(`❌ Failed to import route: ${entry.name}`);
                console.error(err);
                throw err;
            }
        }
    }
};

// ============================================================
// 🩺 サーバ起動
// ============================================================
try {
    await loadRoutes(apiRoot);

    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok', env: process.env.NODE_ENV });
    });

    const PORT = Number(process.env.PORT || 3000);
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
} catch (err) {
    console.error('🔥 Fatal error during startup:');
    console.error(util.inspect(err, { depth: 10, colors: true }));
}


// import cors from 'cors';
// import dotenvFlow from 'dotenv-flow';
// import express from 'express';
// import fs from 'fs/promises';
// import path, { dirname } from 'path';
// import { loadConfig, register } from 'tsconfig-paths';
// import { fileURLToPath, pathToFileURL } from 'url';
// import util from 'util';

// // ============================================================
// // 🧭 ESM用 __dirname 定義
// // ============================================================
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // ============================================================
// // 🌱 dotenv-flow 環境変数ロード
// // ============================================================
// dotenvFlow.config({
//     path: path.resolve(__dirname, '../env'),
// });
// console.log('🌿 dotenv-flow loaded:', process.env.NODE_ENV);

// // ============================================================
// // 🧩 tsconfig-paths 登録
// // ============================================================
// const projectRoot = path.resolve(__dirname, '../../../..'); // ← care-match 直下
// const tsConfig = loadConfig(projectRoot);

// if (tsConfig.resultType === 'success') {
//     register({
//         baseUrl: tsConfig.absoluteBaseUrl,
//         paths: tsConfig.paths,
//     });
//     console.log('✅ tsconfig-paths registered:', tsConfig.absoluteBaseUrl);
// } else {
//     console.warn('⚠️ tsconfig-paths failed to load config', tsConfig.message ?? '');
// }

// // ============================================================
// // 🚀 Express サーバ初期化
// // ============================================================
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// console.log('🟡 Starting server boot sequence...');
// const apiRoot = path.resolve(__dirname, '.');

// // ============================================================
// // 📦 ルート自動ロード（ESM import 方式）
// // ============================================================
// const loadRoutes = async (dir: string) => {
//     console.log(`⚙️  Calling loadRoutes... apiRoot = ${dir}`);
//     const entries = await fs.readdir(dir, { withFileTypes: true });

//     for (const entry of entries) {
//         const fullPath = path.join(dir, entry.name);

//         if (entry.isDirectory()) {
//             await loadRoutes(fullPath);
//             continue;
//         }

//         if (entry.isFile() && entry.name.endsWith('Routes.ts')) {
//             const filePath = path.resolve(fullPath);
//             console.log(`📦 Importing route: ${filePath}`);

//             try {
//                 // ✅ ESM正規対応：動的importを使用
//                 const routeModule = await import(pathToFileURL(filePath).href);
//                 const router = routeModule.default;

//                 if (router) {
//                     app.use('/', router);
//                     console.log(`✅ Registered route: ${path.relative(apiRoot, fullPath)}`);
//                 } else {
//                     console.warn(`⚠️ No default export found in ${entry.name}`);
//                 }
//             } catch (err) {
//                 console.error(`❌ Failed to import route file: ${entry.name}`);
//                 console.error('💥 Import error details:', err);
//                 throw err;
//             }
//         }
//     }
// };

// // ============================================================
// // 🩺 サーバ起動
// // ============================================================
// try {
//     await loadRoutes(apiRoot);

//     app.get('/health', (_req, res) => {
//         res.status(200).json({ status: 'ok', env: process.env.NODE_ENV });
//     });

//     const PORT = process.env.PORT || 3000;
//     app.listen(PORT, () => {
//         console.log(`🚀 Server running on port ${PORT}`);
//     });
// } catch (err) {
//     console.error('🔥 Fatal error caught in startup block:');
//     console.error(util.inspect(err, { depth: 10, colors: true }));
// }
