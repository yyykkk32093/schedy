
# Copilot（AIエージェント）向け開発ガイド

## 🏗️ アーキテクチャ全体像
- **フロントエンド**: `frontend/`（React, Vite, TypeScript）…UIとAPI通信を担当
- **バックエンド**: `backend/src/api/`（Express API）…フロントとアプリ/ドメイン層の橋渡し
- **アプリケーション/ドメイン層**: `backend/src/application/`, `backend/src/domains/`（DDDレイヤ構造）
- **共通型定義**: `backend/src/domains/_sharedDomains/`, `backend/src/application/_sharedApplication/`（DTO, ValueObject, Enum など型安全のための共通モジュール）
- **データベース**: Prisma管理（`backend/prisma/`）

## 🔄 データフロー・サービス境界
- **フロントエンド**はHTTP経由でバックエンドAPIを呼び出し（例: `backend/src/api/server.ts`）
- **API層**で認証・バリデーション・例外処理を一元管理
- **UseCase層**はAPIコントローラから呼ばれるアプリケーションロジック
- **ドメイン層**は純粋なビジネスロジックのみ（インフラ依存なし）

## 🛠️ 主な開発ワークフロー
- **バックエンドビルド**: `backend/`で `npx tsc -p tsconfig.server.json`
- **バックエンド起動**: `backend/`で `NODE_ENV=local node dist/api/server.js`
- **Prismaマイグレーション**: `backend/prisma/prisma.md` 参照
  - マイグレーション作成: `env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate dev --name <migration_name>`
  - DBリセット: `env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate reset --force`
  - クライアント生成: `env $(grep -v '^#' env/.env.local | xargs) pnpm prisma generate`
- **ローカルDB起動**: `brew services start postgresql@14`

## 📦 プロジェクト固有のルール・慣習
- **APIバージョン管理**: RESTfulなバージョン（例: `/v1/auth/password`）をURLに付与
- **フロント→ドメイン層の直接呼び出し禁止**: 必ずAPI層を経由
- **型共有**: DTO/ValueObjectは共通モジュールで管理し、型安全を担保
- **Outboxパターン**: 非同期・イベント駆動処理は `backend/prisma/prisma.md` と `backend/src/job/outbox/` 参照

## 📚 主要な参照ファイル・ディレクトリ
- **アーキテクチャ解説**: `backend_README.md`
- **Prisma/DB運用**: `backend/prisma/prisma.md`
- **APIエントリ**: `backend/src/api/server.ts`
- **UseCase実装例**: `backend/src/application/`
- **ドメインモデル**: `backend/src/domains/`

---

- DDDレイヤやAPI境界を守ったコード変更を徹底
- 複数レイヤにまたがるデータは共通型を更新
- 新機能追加時は既存のディレクトリ構成・命名規則に従うこと
