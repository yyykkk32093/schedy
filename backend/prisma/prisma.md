📘 Prisma・Outbox Worker 手順まとめ（README 用）
# Prisma / Outbox Worker 手順まとめ

## 📦 1. Prisma の基本コマンド

### 🔹 スキーマ変更の反映（開発時）
```sh
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate dev --name <migration_name>


目的：

schema.prisma に変更がある場合に
新しい migration を作成＆DB に適用する

🔹 既存 migration をすべて適用し直す（DB 初期化）
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate reset --force


目的：

スキーマが大きく変わったとき

Migration が壊れたとき

DB を完全初期化して再適用

🔹 Prisma Client の再生成
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma generate


目的：

Prisma schema 変更後の
TypeScript クライアントコードを再生成する

🔹 DB の実体を schema.prisma に取り込み（逆生成）
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma db pull


目的：

既存カラムが何か忘れたときなど

DB → Prisma（逆方向）に同期
※ 基本は使わない（使うとスキーマ壊す危険がある）

🗄 2. psql での基本確認コマンド
🔹 テーブル一覧確認
psql reserve_manage -c '\dt'

🔹 スキーマ一覧確認
psql reserve_manage -c '\dn'

🔹 特定テーブルの構造
psql reserve_manage -c '\d "OutboxEvent";'

🚀 3. Outbox Worker 起動
🔹 1. ビルド
pnpm build

🔹 2. Worker 起動
env $(grep -v '^#' env/.env.local | xargs) node dist/job/outbox/startOutboxWorker.js


ログ例：

🚀 OutboxWorker started.
📦 [OutboxWorker] Processing 1 events...

🛑 4. Worker の停止
🔹 Ctrl + C
Ctrl + C


でプロセス終了。

🧪 5. Outbox データ挿入テスト
insert into "OutboxEvent" (
  id, eventName, eventType, aggregateId, routingKey,
  payload, status, occurredAt, retryCount, maxRetries, retryInterval
) values (
  'test-1',
  'PasswordUserLoggedInEvent',
  'auth.login.success',
  'user-1',
  'audit.record-auth-log',
  '{}',
  'PENDING',
  now(),
  0,
  5,
  5000
);


Worker が拾って Audit API に送信されれば OK。


📘 Prisma / DB 定義変更手順書（drift 防止ガイド）

※そのまま MD として使える

# Prisma DB 定義変更ガイド

（安全な運用のためのベストプラクティス）

このドキュメントでは、
Prisma の schema / migration / DB を安全に管理し、
drift（DB と migration 履歴のズレ）を防ぐための手順とルールをまとめます。

Prisma の基本設計は：

schema.prisma（正） → migration（履歴） → DB（反映）


であり、逆方向（DB → schema）に変更を伝播させる操作は基本的に禁止です。

## 🚫 やってはいけないこと
❌ 1. prisma db push を使う

→ migration ファイルが作られず、DB が勝手に更新されるため drift の原因になる。

❌ 2. DB を直接編集（ALTER TABLE / CREATE TABLE）

→ migration の履歴と食い違いが起きる。

❌ 3. prisma/migrations/ フォルダを消す

→ DB には履歴が残るため migrate が進まず “drift detected” になる。

❌ 4. ENV を切り替えて別 DB に migrate dev を実行

→ ローカル履歴と別環境の DB が同期しなくなる。

## ✅ 安全な DB 定義変更フロー
### Step 1：schema.prisma を編集する

必ず schema ファイルを「正」として編集します。

例：

model OutboxEvent {
  maxInterval Int @default(60000)
  nextRetryAt DateTime @default(now())
}

### Step 2：migration を作る
npx prisma migrate dev -n <変更名>


例：

npx prisma migrate dev -n add_nextRetryAt_and_maxInterval


これで：

migration ファイルが prisma/migrations/xxxx/ に生成される

DB に適用される

_prisma_migrations に履歴が記録される

### Step 3：Prisma Client を更新
npx prisma generate


→ TypeScript で新カラムが使えるようになる。

### Step 4：コードに反映

Repository / Domain / DTO 等に追加したカラムを追加・修正する。

### Step 5：動作確認
npx prisma studio


またはアプリケーション実行で新カラムの動作を確認。

## 🛑 Drift が起きた場合の対応
👇 drift とは：
- DB に適用済みの migration がローカルの migrations から消えた
- DB が手動で変更され、migration と矛盾した
- db push を使って migration なしで DB 編集が行われた

📌 対応方法（開発 DB 限定）
npx prisma migrate reset
npx prisma migrate dev -n init_schema
npx prisma generate


※ DB がリセットされるので注意
（必要なら事前に pg_dump でバックアップ）

## 📌 運用の基本ルール（重要）
✔ ルール 1：DB は “絶対に” schema.prisma から作る

手作業で RDBMS を触らない。

✔ ルール 2：migration ファイルは Git で管理

ブランチ切り替えで消さないよう注意。

✔ ルール 3：migrate dev はローカル開発 DB のみに使う

本番では migrate deploy を使用する。

✔ ルール 4：ドリフトしたら reset する

ローカルなら迷わずリセット。

## 📌 例：安全な日常作業例
🌱 新しいカラムを追加したい

schema.prisma 編集

migrate dev

prisma generate

コード修正

動作確認

🧪 新しいテーブルを追加したい

同じ流れで OK。

⛔ 既存テーブルを手作業で変えたい？

→ ❌ ダメ。schema → migrate でやる。


---

## 🔁 OutboxRetryPolicy（運用ルール）

routingKey は「Dispatcher/Handler を結びつける明示的契約」です。

### ✅ ルール
- routingKey を追加する場合、**必ず OutboxRetryPolicy を追随投入**する（seed/migrationによる担保）。
- 起動時に落とすような fail-fast チェックは現時点では行わない。

### 🧩 投入方法（例）
- マスタ投入SQL: `backend/infra/database/master/outbox-retry-policy.sql`

### ⚠️ 未登録routingKeyの扱い
- Worker側で FAILED / DLQ になり得る挙動は仕様として許容する。
- 暗黙的な default retry / handler フォールバックは行わない。