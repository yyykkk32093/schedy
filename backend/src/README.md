# backend/src 規約

> Backend のレイヤ責務・命名規約・URL 規約を定義する。
> 詳細は [projects/00_requirements/202603_08_backend_refactoring/10_implementation-plan.md](../../projects/00_requirements/202603_08_backend_refactoring/10_implementation-plan.md) を参照。

---

## 1. レイヤ構造（DDD）

```
api/             ← Web Adapter（Express）。HTTP 依存はここに閉じ込める
  front/         ← フロントエンド向け API
  integration/   ← 外部サービスからの Webhook 受信（Stripe / RevenueCat / FCM）
  middleware/    ← 認証・認可・バリデーション
  ws/            ← WebSocket
application/     ← UseCase。複数 Repository をオーケストレーションする
domains/         ← Entity / Value Object / Repository Interface（純粋ドメイン）
  */infrastructure/ ← Repository 実装（Prisma 利用は ここのみ許可）
integration/     ← 外部サービス送信側（Outbox dispatcher）
job/             ← バッチ・Worker
```

### レイヤ間 import ルール（ESLint 強制）

| レイヤ                                                  | 禁止                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `api/**`（`_usecaseFactory.ts` / `_bootstrap/**` 除く） | `@prisma/client`, `@/_sharedTech/db/client`, `domains/**/infrastructure/**` |
| `application/**`                                        | `express`, `domains/**/infrastructure/**`                                   |
| `domains/**`（`infrastructure/**` 除く）                | `@prisma/client`, `express`                                                 |

違反は `pnpm lint` で検出される。新規違反は禁止。
既存違反は `// eslint-disable-next-line no-restricted-imports -- TODO(Phase 2): DDD 違反矯正対象` で抑止し、Phase 2 で順次解消する。

---

## 2. 命名規約

### ディレクトリ・ファイル
- すべて **camelCase**（例: `deviceToken/`, `userSchedule/`）
- kebab-case は使わない

### Prisma model / DB 物理名
- model 名: **PascalCase**（例: `User`, `CommunityMembership`）
- field 名: **camelCase**（例: `createdAt`, `userId`）
- 物理テーブル名: **snake_case + 複数形**（`@@map("users")`, `@@map("community_memberships")`）
- 物理カラム名: **snake_case**（`@map("created_at")`）

### Master / Policy 命名（3 層）

| 種別                 | 命名        | 例                                               |
| -------------------- | ----------- | ------------------------------------------------ |
| 純粋マスタ           | `XxxMaster` | `CategoryMaster`, `PlanMaster`                   |
| 設定マスタ（ルール） | `XxxPolicy` | `PlanFeaturePolicy`, `CommunityGradeLimitPolicy` |
| テナント別データ     | suffix なし | `ExpenseCategory`, `CommunityTag`                |

### Prisma スキーマ分割（multiSchema）

| schema         | 用途                                                    |
| -------------- | ------------------------------------------------------- |
| `identity`     | User                                                    |
| `auth`         | 認証情報（PasswordCredential, OAuth, SecurityState 等） |
| `master`       | XxxMaster, XxxPolicy 全般                               |
| `outbox`       | OutboxEvent, OutboxRetryPolicy, OutboxDeadLetter        |
| `community`    | Community 配下                                          |
| `activity`     | Activity / Schedule / Participation / Waitlist          |
| `messaging`    | ChatChannel / Message / Stamp                           |
| `announcement` | Announcement / Poll                                     |
| `media`        | Album / Photo / Upload                                  |
| `notification` | Notification / DeviceToken                              |
| `billing`      | Payment / Subscription                                  |
| `support`      | Inquiry / Help / Matching / Expense                     |

---

## 3. URL 規約（REST）

- すべて `/v1/` prefix
- リソース名は **複数形**（`/users`, `/communities`）
- 階層は親子関係で表現（`/communities/:communityId/locations`）
- Toggle 系は **リソース化**（`POST /communities/:id/bookmarks` + `DELETE /communities/:id/bookmarks/:id`）
- Action 系（cancel / restore 等）は許容

### マスタリソース
- `/v1/masters/*` は使わない。個別リソースに分割（`/v1/categories`, `/v1/plans` 等）

### Webhook
- 設定 UI 用: `/v1/communities/:id/webhook-configs`
- 外部受信: `/v1/integrations/webhooks/:provider`

---

## 4. ディレクトリ分離ルール

- 1 feature 内の `routes/*.ts` が **3 個以上** または **総コード量 500 行超** で、独立 feature に切り出し検討
- レイヤ間で feature 名は **1:1** にする（`api/front/foo/` ↔ `application/foo/` ↔ `domains/foo/`）

---

## 5. 利用コマンド

```bash
pnpm lint           # ESLint チェック
pnpm lint:fix       # 自動修正可能なものを修正
pnpm typecheck      # tsc -p tsconfig.server.json --noEmit（必要に応じて追加）
pnpm test           # vitest
pnpm test:e2e       # E2E テスト
```
