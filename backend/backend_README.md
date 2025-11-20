# 🧭 Backend Architecture Note  
## なぜ API 層を分離したのか

---

## 🎯 背景

当初は、フロントエンド（React）とドメイン層を同一パッケージに配置し、  
以下のように **UI → UseCase → Domain** の直接呼び出し構造を目指していた。

```
UI(React)
  ↓
Application(UseCase)
  ↓
Domain(Entity, ValueObject)
```

これはクリーンアーキテクチャ／DDD（Domain Driven Design）の依存方向原則に忠実で、  
UI層がドメイン層に依存しても逆方向の依存が発生しない理想的な構造だった。

---

## ⚠️ 課題（実行環境制約）

React はブラウザ上で動作するため、以下のような制約が存在する。

| 種別 | 内容 |
|------|------|
| 🧩 Node依存ライブラリ不可 | bcrypt, fs, path, crypto など Node.js 標準機能がブラウザで使用不可 |
| ⚙️ モジュール構成の不一致 | React（Vite）の ESM 環境ではサーバー側 TypeScript ファイルを直接 import できない |
| 🔐 セキュリティ上の問題 | ドメインロジック（UseCase, Entity）をブラウザに置くと内部実装が露出する |
| 💾 インフラ層の実行不可 | Repository 実装は DB・外部API を前提にしており、ブラウザでは動作しない |

結果として、
> UI が直接 UseCase を呼び出す構成は「論理的には正しいが、実行環境として成立しない」

という結論に至った。

---

## 🧱 解決方針（API 層の導入）

この課題を解消するため、**UI とドメイン層の間に API 層（Express）**を新設した。

```
[Frontend] React
    ↓ HTTP通信（fetch / axios）
[Backend] Express API
    ↓
[Application] UseCase
    ↓
[Domain] Entity / ValueObject
```

### API 層の主な責務

| 項目 | 役割 |
|------|------|
| 🌐 通信の橋渡し | フロントエンドとバックエンドを HTTP 経由で疎結合に接続 |
| 🔒 セキュリティ担保 | 認証・認可、バリデーション、例外処理の集中管理 |
| ⚙️ 責務分離 | UI 層を入出力処理に限定し、ドメインロジックはサーバー側で完結 |
| 🔄 バージョン管理 | `/v1/auth/password` のような RESTful バージョニングを適用可能 |

---

## ✅ 現行構成の特徴

| 層 | 役割 |
|----|------|
| **frontend** | React による表示・API呼び出しを担当 |
| **backend** | Express による API 提供と UseCase 呼び出しを担当 |
| **sharedDomains** | 共通の ValueObject / DTO / Enum を配置し、型整合性を担保 |

この構成により：
- 実装上も **DDD の依存方向（UI → Application → Domain）** を維持  
- 実行上も **ブラウザとサーバーの責務分離** を実現  

---

## 📘 まとめ

| 項目 | 旧構成（UI直呼び） | 新構成（API分離） |
|------|--------------------|------------------|
| 呼び出し経路 | UI → UseCase | UI → API → UseCase |
| 実行環境 | ブラウザ | サーバー |
| 問題点 | Node依存不可、セキュリティリスク | API経由で解消 |
| DDD整合性 | 概念上◯ 実行上× | 概念・実行ともに◯ |
| 特徴 | 単純構成だが制約多 | 拡張性・安全性・現実性を両立 |

---

## 🗒 教訓

> 「クリーンアーキテクチャの原則を現実の実行環境でどう成立させるか」  
> という課題に対する、実務的な折衷案が **API 層の導入** である。

---

### 🧩 備考
- Express は Tomcat や Spring Boot の「アプリケーションサーバー層」に相当する。  
- React は「プレゼンテーション層（View）」であり、バックエンドロジックを持たない。  
- API 層を介することで、**認証／認可／非同期処理／ログ集約** などを共通化できる。

---


------
Prism導入時のenv BK
# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# The following `prisma+postgres` URL is similar to the URL produced by running a local Prisma Postgres 
# server with the `prisma dev` CLI command, when not choosing any non-default ports or settings. The API key, unlike the 
# one found in a remote Prisma Postgres URL, does not contain any sensitive information.

DATABASE_URL="prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ"

------

API起動：
フロントと同じパッケージJsonを使ってるせいで
Package Jsonのtype="module"を消さないとうまくいかない
care-match % NODE_ENV=local npx ts-node -r tsconfig-paths/register -P tsconfig.server.json src/backend/api/server.ts
で、ここを消すと多分フロントのビルドに影響が出る。

 npx tsc -p tsconfig.server.json
(base) yoshimotokaito@yoshimotoisaoninnoMacBook-Air backend % NODE_ENV=local node dist/api/server.js


# =====================================================
# 🧱 PostgreSQL ローカル環境セットアップ（Mac / brew）
# =====================================================

# 1️⃣ PostgreSQLをインストール
brew install postgresql@14

# 2️⃣ サービスを起動（常駐化）
brew services start postgresql@14

# 3️⃣ PostgreSQLロール（DBユーザー）を作成（macOSユーザー名と同名で作成）
createuser -s $(whoami) || echo "ユーザーはすでに存在しています👌"

# 4️⃣ データベース作成
createdb reserve_manage || echo "DBはすでに存在しています👌"

# 5️⃣ PostgreSQLに接続（CLIへ）
psql postgres <<'SQL'
-- reserve_manage の所有者・権限を設定
ALTER DATABASE reserve_manage OWNER TO $(whoami);
GRANT ALL PRIVILEGES ON DATABASE reserve_manage TO $(whoami);
GRANT ALL PRIVILEGES ON SCHEMA public TO $(whoami);
-- 任意でパスワード設定（Prismaで必要になることがある）
ALTER ROLE $(whoami) WITH PASSWORD 'password';
\q
SQL

# 6️⃣ 接続確認
psql -l

# 7️⃣ .env.local（アプリ用設定ファイル）に追記
echo 'DATABASE_URL="postgresql://'"$(whoami)"':password@localhost:5432/reserve_manage?schema=public"' > src/env/.env.local
echo "✅ .env.local を作成しました！"

# 8️⃣ Prismaマイグレーション（DBにスキーマを反映）
cd backend
pnpm prisma migrate dev --name init_outbox

# ✅ 完了！
# テーブル確認: psql reserve_manage -> \dt
# 停止したいとき: brew services stop postgresql@14


Prism CLIでDBのDDL反映：
env $(grep -v '^#' src/env/.env.local | xargs) pnpm prisma migrate dev --name init_outbox
env $(grep -v '^#' src/env/.env.local | xargs) pnpm prisma generate
# =====================================================
# 🧱 PostgreSQL ローカル環境（アプリ専用ユーザー版）
# =====================================================

# 1️⃣ サービス起動確認
brew services start postgresql@14

# 2️⃣ PostgreSQL に接続してアプリ用ユーザー・DBを作成
このままコピペで通ります👇
（※DO $$ ... $$; の閉じ方が超重要）

psql postgres <<'SQL'
-- アプリ専用ユーザー作成（存在しなければ）
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
      CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
   END IF;
END $$;

-- アプリ専用DB作成（存在しなければ）
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reserve_manage') THEN
      CREATE DATABASE reserve_manage OWNER app_user;
   END IF;
END $$;

-- 権限付与
GRANT ALL PRIVILEGES ON DATABASE reserve_manage TO app_user;

\q
SQL

# 3️⃣ .env.local の作成（AWSでも共通で使える）
mkdir -p src/env
cat <<'EOF' > src/env/.env.local
DATABASE_URL="postgresql://app_user:app_password@localhost:5432/reserve_manage?schema=public"
EOF
echo "✅ .env.local を作成しました！（ユーザー: app_user）"

# 4️⃣ Prisma マイグレーション実行
cd backend
pnpm prisma migrate dev --name init_outbox

# ✅ 完了
# テーブル確認: psql -U app_user reserve_manage -> \dt
# サービス停止: brew services stop postgresql@14


# テーブル一覧
psql -U app_user -d reserve_manage -c "\dt"

# Prisma 管理テーブル確認
psql -U app_user -d reserve_manage -c "SELECT * FROM _prisma_migrations;"

その「core / supporting / generic をディレクトリとして明示的に切るか？」って、実はDDD導入の成熟度でよく議論になるポイントです。

🧩 結論（先に言う）

❌ 推奨はしない。
理由：ドメインの階層関係をディレクトリ構造で固定すると、柔軟性を失うから。

🧠 もう少し具体的に言うと

DDDにおける「Core」「Supporting」「Generic」はあくまで
戦略的設計上の“意味付け” であって、
物理的なフォルダ階層とは別概念 です。

例：フォルダで階層を作った場合
domains/
 ├── core/
 │   ├── auth/
 │   └── reservation/
 ├── supporting/
 │   ├── audit/
 │   └── notification/
 └── generic/
     └── sharedDomains/

🟢 メリット

一見わかりやすい（どれが中核かが目に見える）

DDDの3層区分（戦略設計）をフォルダでも表現できる

🔴 デメリット（でかい）

運用フェーズで変わったときに階層変更が地獄

ある時点で「audit が core 相当に昇格した」場合、移動が面倒
→ import パス、tsconfig パス、registry すべて修正

依存方向を物理階層で縛ると拡張がしにくい

supporting/notification から core/auth を参照したくなったときなど

戦略設計（思想）を構造と結びつけすぎる

そもそも Core / Supporting / Generic は設計上の抽象概念

プロジェクトが成長するにつれて位置づけが変わることが多い

💡 現場感で言うと

DDD上の「Core/Supporting/Generic」は
　コードレビューやアーキ設計ドキュメントで説明する概念。

フォルダ構造はあくまで “Bounded Context単位” に並べる方が長生きする。


ーーーーーーーーーーーーーーーーーーー
ーーーーーーーーーーーーーーーーーーー
📘 ESM + TypeScript + dist 実行でエイリアスが効かない問題の解決記録
🎯 結論（最終的な解決策）

TypeScript を ESM で運用しつつ Node.js で dist を実行する場合、
tsconfig のパスエイリアス（@/xxx）は Node.js の実行時に解決されない。

そのため、

🔧 → tsc-alias を採用し、ビルド後に import パスを書き換えることが必須
🔥 問題の症状

サーバー起動時に、以下のエラーが発生：

Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/domains'
 imported from /backend/dist/application/auth/password/usecase/LoginPasswordUserUseCase.js


また、Express のルート自動読み込みも失敗：

❌ Failed to import route: passwordAuthRoutes.js


これは結果的に：

全 API が 404 になる

OutboxPublisher も叩けない

ルートは dist 上で1つも登録されず死ぬ

という状態。

🔍 原因1：dist 実行では TypeScript のパスエイリアスが無効になる

server.ts 内で tsconfig-paths を登録していたが：

register({
  baseUrl: tsConfig.absoluteBaseUrl,
  paths: tsConfig.paths,
});


これは ts-node（TypeScript のまま実行）では有効
しかし、Node.js で .js を ESM として実行すると無効。

理由：

tsconfig-paths は “ts-node 用”

Node.js（ESM）は tsconfig の paths を知らない

import のパス解決は Node が担当

Node は "@/domains" の存在を知らない

🔍 原因2：dist 側で server.js が src の tsconfig を参照していなかった

修正前：

const projectRoot = path.resolve(__dirname, '..'); 


dist/api/server.js の __dirname は:

backend/dist/api


.. すると：

backend/dist


つまり dist 配下の tsconfig を参照していた
（存在しない or baseUrl 無効）

→ これでも alias は解決されない。

🔥 最終原因（もっとも致命的）

Node.js の ESM は パスエイリアスそのものを解決できない仕様。

つまり正しく tsconfig を読んだとしても 動かない。

🧠 採用した最適解：tsc-alias でエイリアスを相対パスに置換

ビルド後の dist の import 文：

import { X } from '@/domains/auth/...';


これを tsc-alias が自動で：

import { X } from '../../domains/auth/...';


のように Node.js が直接解決できる相対パスに書き換えてくれる。

これにより：

dist 実行でもエイリアスが働く

server がすべての routes を正常に import

API ルートが正しく登録

すべて正常化。

🔧 導入手順（正式版）

tsc-alias を追加

pnpm add -D tsc-alias


package.json の build を変更

"scripts": {
  "build": "tsc -p tsconfig.server.json && tsc-alias -p tsconfig.server.json"
}


tsconfig.server.json に baseUrl と paths を維持
（あなたの現状の設定のままで OK）

ビルド → dist

pnpm build


起動

NODE_ENV=local node dist/api/server.js


→ エラー消えた。
→ curl が通るようになった。
ーーーーーーーーーーーーーーーーーーー

HTTP通信に使うライブラリ
undici