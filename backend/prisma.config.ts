import dotenvFlow from 'dotenv-flow';
import path from 'path';

import { defineConfig, env } from 'prisma/config';

// Prisma CLI 実行時に backend/env の .env.* を読み込む
// - prisma-migrate-dev tool でも DATABASE_URL を解決できるようにする
dotenvFlow.config({
  path: path.resolve(process.cwd(), 'env'),
})

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
