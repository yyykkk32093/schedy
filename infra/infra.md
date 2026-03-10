# 🏗️ インフラ構成（ローカル開発環境）

## 概要

ローカル開発に必要なミドルウェアを **Docker Compose** で一括管理している。  
本番環境（AWS）と同等のサービスをローカルで再現し、クラウドへの依存なしに開発・テストが可能。

| サービス                   | 技術                   | コンテナ名          | ポート | 利用目的                                   |
| -------------------------- | ---------------------- | ------------------- | ------ | ------------------------------------------ |
| **データベース**           | PostgreSQL 14 (Alpine) | `schedy-postgres`   | `5432` | アプリケーションの永続化層                 |
| **オブジェクトストレージ** | LocalStack (S3)        | `schedy-localstack` | `4566` | ファイルアップロード（ロゴ・カバー画像等） |

---

## 起動・停止コマンド

プロジェクトルートで実行する。

```bash
# コンテナ起動（バックグラウンド）
pnpm infra:up

# コンテナ停止
pnpm infra:down

# コンテナ停止 + ボリューム削除（DB・S3データ全リセット）
pnpm infra:reset
```

> ⚠️ `infra:reset` を実行すると DB データが全て消えるため、再度マイグレーションが必要になる。

---

## PostgreSQL

### 利用目的
- Prisma ORM 経由でアプリケーションの全データを管理
- マイグレーション管理も Prisma で実施

### 接続情報

| 項目     | 値               |
| -------- | ---------------- |
| Host     | `localhost`      |
| Port     | `5432`           |
| Database | `reserve_manage` |
| User     | `app_user`       |
| Password | `app_password`   |

```
DATABASE_URL="postgresql://app_user:app_password@localhost:5432/reserve_manage?schema=public"
```

### DBeaver 等の GUI ツールから接続
上記の接続情報をそのまま入力すれば接続可能。

### マイグレーション

```bash
cd backend

# マイグレーション適用
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate deploy

# マイグレーション作成（スキーマ変更後）
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate dev --name <migration_name>

# DB リセット + 全マイグレーション再適用
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate reset --force
```

> 詳細は [backend/prisma/prisma.md](../backend/prisma/prisma.md) を参照。

### 注意事項
- brew 版 PostgreSQL（`postgresql@14`）が起動しているとポート `5432` が競合する
- 競合時は `brew services stop postgresql@14` で停止してから Docker を起動する

---

## LocalStack（S3）

### 利用目的
- 本番の AWS S3 をローカルでエミュレート
- ファイルアップロード機能（コミュニティのロゴ画像・カバー画像等）の開発・テストに使用
- フロントエンドからの直接アクセスに対応する CORS 設定済み

### 構成

| 項目             | 値                      |
| ---------------- | ----------------------- |
| エンドポイント   | `http://localhost:4566` |
| リージョン       | `ap-northeast-1`        |
| バケット名       | `schedy-local`          |
| アクセスキー     | `test`                  |
| シークレットキー | `test`                  |

### 初期化スクリプト

[infra/localstack/init-s3.sh](localstack/init-s3.sh) がコンテナ起動時に自動実行され、以下を行う：

1. S3 バケット `schedy-local` の作成
2. CORS 設定（`http://localhost:5173` からの GET/PUT/POST を許可）

### 動作確認

```bash
# バケット一覧
aws --endpoint-url=http://localhost:4566 s3 ls

# バケット内のオブジェクト一覧
aws --endpoint-url=http://localhost:4566 s3 ls s3://schedy-local/
```

### 環境変数（backend/env/.env.local）

```dotenv
S3_BUCKET=schedy-local
S3_REGION=ap-northeast-1
S3_ENDPOINT=http://localhost:4566
S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

`S3_ENDPOINT` が設定されている場合、`S3FileStorageService` が LocalStack に接続する。  
本番環境ではこの変数を省略し、実 AWS S3 に接続する。

---

## ディレクトリ構成

```
schedy/
├── docker-compose.yml          # Docker Compose 定義
├── package.json                # infra:up / infra:down / infra:reset スクリプト
└── infra/
    ├── infra.md                # 本ドキュメント
    └── localstack/
        └── init-s3.sh          # S3 バケット初期化スクリプト
```

---

## ボリューム

| ボリューム名        | 用途                      |
| ------------------- | ------------------------- |
| `schedy-pgdata`     | PostgreSQL のデータ永続化 |
| `schedy-localstack` | LocalStack の状態永続化   |

`pnpm infra:reset` でボリュームごと削除される。

---

## トラブルシューティング

| 症状                         | 原因                            | 対処                                |
| ---------------------------- | ------------------------------- | ----------------------------------- |
| `port 5432 already in use`   | brew 版 PostgreSQL が起動中     | `brew services stop postgresql@14`  |
| `connection refused` on 5432 | Docker コンテナ未起動           | `pnpm infra:up`                     |
| S3 バケットが見つからない    | LocalStack 未起動 or 初期化失敗 | `pnpm infra:reset` で再作成         |
| マイグレーションエラー       | DB リセット後に未適用           | `pnpm prisma migrate deploy` を実行 |
