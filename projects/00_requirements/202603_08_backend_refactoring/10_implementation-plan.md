# 202603_08 Backend Refactoring 実装計画（確定版）

> 作成日: 2026-05-11
> 方針: **理想駆動**。動いていないシステムなので移行コストを考慮せず、理想形に直接到達する
> スコープ: 9 評価項目すべてを本案件で完遂（Phase 単位で順次 PR）

---

## 確定事項サマリ

| #   | 論点               | 決定                                                                                                                                               |
| --- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | DeviceToken        | **凍結**（コード残置 + TODO コメント。ネイティブ実装時に再開）                                                                                     |
| D2  | ユーザー側 Inquiry | **削除**（admin / 匿名 POST のみ残す）                                                                                                             |
| D3  | Master 命名        | **3 層命名**（XxxMaster / XxxPolicy / suffix なし）                                                                                                |
| D4  | PG 物理名          | **snake_case + 複数形**（`@@map` / `@map` で物理名のみ。Prisma 論理名は維持）                                                                      |
| D5  | スキーマ分割       | **全 12 schema**（identity / auth / master / outbox / community / activity / messaging / announcement / media / notification / billing / support） |
| D6  | REST 移行          | **v1 を直接破壊変更**（v2 並走なし、フロント同時更新）                                                                                             |
| D7  | Analytics          | **Repository に押し込み**（純粋 DDD、Read Model 層は作らない）                                                                                     |
| D8  | Lint 防御線        | **ESLint でレイヤ間 import 規則を強制**                                                                                                            |
| D9  | Webhook            | **`webhookConfig`（設定）+ `integration/{stripe,revenuecat,fcm}`（受信）に分離**                                                                   |
| D10 | スコープ           | **本案件で全 Phase 対応**                                                                                                                          |
| D11 | Phase 構成         | **7 Phase 順次 PR**                                                                                                                                |

---

## Phase 構成（実施順）

### Phase 0: 規約整備 + 防御線

**目的**: 後続 Phase の前提となる規約・自動チェック基盤を整える。

#### 作業内容
- `backend/src/README.md` を新設し、以下を明文化：
  - DDD レイヤ責務（Router / Controller / Service / UseCase / Repository / Domain）
  - 命名規約（feature 名は camelCase、マスタは Master/Policy suffix）
  - URL 規約（複数形・ネスト・toggle はリソース化）
- ESLint `no-restricted-imports` を設定し、レイヤ間 import を機械チェック化：
  - `api/**`（`_usecaseFactory.ts` / `_bootstrap/**` 除く）→ `@prisma/client` / `domains/**/infrastructure/**` 直 import 禁止
  - `application/**` → Express 型禁止
  - `domains/**`（`infrastructure/**` 除く）→ `@prisma/client` / Express 禁止
- 既存違反は `// eslint-disable-next-line` で抑止 → Phase 2 で順次解消
- `zod-to-openapi` 導入（OpenAPI 自動生成基盤、Phase 3 で活用）

#### 完了条件
- `pnpm lint` が通る（既存違反は抑止コメント付きで通過）
- README に規約が記載されている

---

### Phase 1: 不要 API・モデル削除（[5]）

**目的**: 死んでいるコード経路を削除し、後続フェーズの対象範囲を縮小する。

#### 作業内容
- ユーザー側 Inquiry エンドポイント削除：
  - `POST /v1/inquiries`（認証あり）, `GET /v1/inquiries`, `GET /v1/inquiries/:id`, `POST /v1/inquiries/:id/messages`（ユーザー側）
  - 該当ルーター・コントローラ・UseCase・型定義を削除
  - 残すのは admin 系と `POST /v1/inquiries/anonymous`
- DeviceToken 関連コードに TODO コメントを追加：
  - `backend/src/api/front/deviceToken/routes/deviceTokenRoutes.ts`
  - `backend/src/integration/dispatcher/handler/PushNotificationIntegrationHandler.ts`
  - 「ネイティブアプリ実装まで凍結」と明記
- CommunityLocation 単体エンドポイント削除：
  - `POST /v1/communities/:communityId/locations`
  - `DELETE /v1/communities/:communityId/locations/:id`
  - フロントは PUT bulk のみ使用するため
- フロント側の不要コード掃除（呼び出していない API client があれば削除）

#### 完了条件
- 削除対象エンドポイントが backend に存在しない
- e2e テスト全合格
- フロント全画面の手動触診完了

---

### Phase 2: DDD 違反解消（[6]）

**目的**: Phase 0 で Lint 化した違反を全件解消する。

#### 作業内容
違反対象（Phase 0 Lint で機械抽出可能）：

| レイヤ        | ファイル                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Controllers   | `helpController.ts`, `inquiryController.ts`, `masterController.ts`, `chatController.ts`, `userController.ts`                             |
| Routes 直叩き | `stampRoutes.ts`, `uploadRoutes.ts`, `communityLocationRoutes.ts`, `communityTagRoutes.ts`, `bookmarkRoutes.ts`, `notificationRoutes.ts` |
| Middleware    | `featureGateMiddleware.ts`, `requireSystemAdmin.ts`                                                                                      |
| UseCase 直 DI | analytics 系 6 ファイル, billing 系 1, participation 系 3+                                                                               |

各ファイルに対して：
1. Domain 層に Repository Interface を追加（無ければ）
2. Infrastructure 層に Prisma 実装を追加
3. Application 層に UseCase を追加 / 既存 UseCase を整備
4. `_usecaseFactory.ts` に DI 登録
5. Controller / Route から UseCase 呼び出しに置換
6. 抑止コメント（`// eslint-disable-next-line`）を削除

Middleware は Repository 経由の薄い Service を介して呼ぶ。
Analytics は Repository に集計メソッドを定義（Read Model 層は作らない）。

#### 完了条件
- ESLint 違反 0
- e2e テスト全合格
- `// eslint-disable-next-line` の抑止コメントが残っていない

---

### Phase 3: REST API 再設計（[9] + [3] master 解体）

**目的**: v1 を破壊的に再設計し、フロントを同時更新する。

#### 作業内容
- `/v1/masters/*` 解体 → 個別リソース化：
  - `/v1/categories`
  - `/v1/participation-levels`
  - `/v1/plans`
- ネスト是正：
  - `DELETE /albums/photos/:photoId` → `DELETE /albums/:albumId/photos/:photoId`
  - `DELETE /announcements/comments/:commentId` → `DELETE /announcements/:id/comments/:commentId`
- Toggle 系のリソース化：
  - `POST /announcements/:id/like` → `POST /announcements/:id/likes` + `DELETE /announcements/:id/likes/:id`
  - `POST /communities/:id/bookmark` → `POST /communities/:id/bookmarks`
- Auth エンドポイント統一：
  - `POST /v1/auth/password`, `POST /v1/auth/oauth/:provider` → `POST /v1/auth/sessions`（body で method 指定）
- Action endpoint 整理：
  - `cancel` / `restore` 等の状態遷移は許容（一般的）
  - `read` 系の実装方針を統一
- billing 系の整理：
  - `POST /v1/billing/cancel` → `DELETE /v1/subscriptions/:id`
- フロント `frontend/src/features/*/api/*.ts` 全 21 ファイルを同 PR で更新
- Zod スキーマから OpenAPI 自動生成（Phase 0 で導入した zod-to-openapi 活用）

#### 完了条件
- 旧エンドポイントが backend に存在しない
- フロント全機能の手動 E2E パス
- OpenAPI スペックが生成される

---

### Phase 4: スキーマ・命名統一（[2] + [3] + [4]）

**目的**: Prisma スキーマを理想形に再構築する（命名・分割・物理名すべて）。

#### 作業内容
- `backend/prisma/schema.prisma` で `multiSchema` preview を有効化
- 12 schema を定義し、全モデルに `@@schema(...)` を付与：

  | schema         | 主モデル                                                                                                                                                                                                                  |
  | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `identity`     | User                                                                                                                                                                                                                      |
  | `auth`         | PasswordCredential, GoogleCredential, LineCredential, AppleCredential, AuthSecurityState, UserWithdrawal                                                                                                                  |
  | `master`       | 全 XxxMaster, 全 XxxPolicy                                                                                                                                                                                                |
  | `outbox`       | OutboxEvent, OutboxRetryPolicy, OutboxDeadLetter                                                                                                                                                                          |
  | `community`    | Community, CommunityMembership, CommunityLocation, CommunityJoinRequest, CommunityBookmark, CommunityCategory, CommunityParticipationLevel, CommunityActivityDay, CommunityTag, CommunityAuditLog, CommunityWebhookConfig |
  | `activity`     | Activity, Schedule, Place, Participation, WaitlistEntry, ParticipationAuditLog, WaitlistAuditLog                                                                                                                          |
  | `messaging`    | ChatChannel, Message, MessageAttachment, MessageReaction, DMParticipant, Stamp, ChannelReadState                                                                                                                          |
  | `announcement` | Announcement, AnnouncementRead, AnnouncementLike, AnnouncementComment, AnnouncementAttachment, AnnouncementBookmark, Poll, PollOption, PollVote                                                                           |
  | `media`        | Album, Photo, Upload                                                                                                                                                                                                      |
  | `notification` | Notification, DeviceToken                                                                                                                                                                                                 |
  | `billing`      | Payment, Subscription 系                                                                                                                                                                                                  |
  | `support`      | Inquiry, InquiryMessage, InquiryAttachment, Help, HelpFeedback, ExpenseCategory, Expense, Matching 系                                                                                                                     |

- マスタ命名統一（D3 の 3 層命名）：

  | 現名                          | 新名                          |
  | ----------------------------- | ----------------------------- |
  | `InquiryCategory`             | `InquiryCategoryMaster`       |
  | `UserFeatureRestriction`      | `PlanFeaturePolicy`           |
  | `UserLimitRestriction`        | `PlanLimitPolicy`             |
  | `CommunityFeatureRestriction` | `CommunityGradeFeaturePolicy` |
  | `CommunityLimitRestriction`   | `CommunityGradeLimitPolicy`   |

- 全テーブルに `@@map("複数形_snake_case")`、全カラムに `@map("snake_case")`：
  - 例: `model User { ... @@map("users") }`
  - 例: `createdAt DateTime @map("created_at")`
  - スクリプトで一括生成（PascalCase → snake_case + pluralize）
- 単一 migration で実施（コード上の rename と DB rename を同時）
- `_usecaseFactory.ts` 内の Repository 名・参照を一斉更新（IDE rename / ts-morph で機械的に）
- 生 SQL（`infra/database/ddl/`, `infra/database/seeds/`）を新名に書き換え
- ドキュメント（README, prisma.md 等）の SQL サンプル更新

#### 完了条件
- `pnpm prisma migrate reset --force` 成功
- `psql` で `\dt master.*`, `\dt community.*` 等が確認できる
- 全テーブル名 snake_case + 複数形
- e2e テスト全合格

---

### Phase 5: Index 補強（[7]）

**目的**: 欠落 INDEX を追加してクエリ性能を担保する。

#### 作業内容
Phase 4 と同 migration に含める（rename 直後の方が安全）：

```prisma
model CategoryMaster {
  @@index([sortOrder])
  @@index([isActive])
  @@schema("master")
  @@map("category_masters")
}

model ParticipationLevelMaster {
  @@index([sortOrder])
  @@schema("master")
  @@map("participation_level_masters")
}

model PlanMaster {
  @@index([isActive, sortOrder])
  @@schema("master")
  @@map("plan_masters")
}

model CommunityActivityDay {
  @@index([communityId])
  @@schema("community")
  @@map("community_activity_days")
}

model CommunityTag {
  @@index([communityId])
  @@schema("community")
  @@map("community_tags")
}

model MessageReaction {
  @@index([stampId])
  @@index([userId])
  @@schema("messaging")
  @@map("message_reactions")
}

model HelpFeedback {
  @@index([userId, createdAt])
  @@schema("support")
  @@map("help_feedbacks")
}

model InquiryMessage {
  @@index([authorUserId])
  @@schema("support")
  @@map("inquiry_messages")
}
```

大テーブル（Message, Participation 等）に追加 INDEX が発生する場合は手動で `CREATE INDEX CONCURRENTLY` に書き換える運用ルールを README に明記。

#### 完了条件
- Phase 4 migration に INDEX 追加が含まれる
- `EXPLAIN ANALYZE` で対象クエリの INDEX 利用確認

---

### Phase 6: DB 名変更（[1]）

**目的**: `reserve_manage` → `tsunaca` に統一。

#### 作業内容
- ローカル/CI 環境：
  - `docker-compose.yml`, `.env.example`, `env/.env.local` の DB 名置換
  - `prisma migrate reset` で再構築
- ドキュメント書き換え（20 オカレンス）：
  - `infra/infra.md`
  - `.github/copilot-instructions.md`
  - `backend/backend_README.md`
- shadow database 名も対応（prisma.config.ts）

#### 完了条件
- `grep -r reserve_manage` が 0 件
- 新 DB 環境でアプリ起動成功
- e2e テスト全合格

---

### Phase 7: ディレクトリ統一（[8]）

**目的**: レイヤ間の feature 1:1 化、命名統一、Webhook 責務分離。

#### 作業内容
- ケース統一：すべて camelCase に
  - `device-token` → `deviceToken`
  - `user-schedule` → `userSchedule`
- レイヤ間 feature 1:1 化：
  - `api/front/{feature}/` ↔ `application/{feature}/` ↔ `domains/{feature}/` を揃える
  - 不足している `application/` / `domains/` を新設（help, inquiry, notification, stamp, upload, master 関連）
- Webhook 責務分離：
  - `api/front/webhook/` → `api/front/webhookConfig/`（自社 Webhook 設定 UI）
  - `api/webhook/stripe/` → `api/integration/stripe/`
  - `integration/billing/`（RevenueCat） → `api/integration/revenuecat/`
  - FCM 受信があれば `api/integration/fcm/`
- sub-feature 抽出ルールを README に明記：
  - 「1 feature 内の routes ファイルが 3 個以上」または「総コード量 500 行超」で独立 feature に切り出す

#### 完了条件
- ディレクトリ命名が camelCase で統一
- Webhook 設定と受信が分離されている
- e2e テスト全合格

---

## 検証戦略（全 Phase 共通）

| 観点       | 手段                                             |
| ---------- | ------------------------------------------------ |
| 静的検証   | `pnpm lint`, `pnpm typecheck`                    |
| 単体テスト | `pnpm test`（vitest）                            |
| E2E テスト | `backend/test/e2e/` 全合格                       |
| 手動触診   | フロント全画面（Phase 1, 3, 6 で必須）           |
| DB 検証    | `prisma migrate reset` → seed → e2e              |
| 性能検証   | Phase 5 後に `EXPLAIN ANALYZE`（対象クエリ抜粋） |

---

## リスク・留意事項

| リスク                            | 対策                                                                       |
| --------------------------------- | -------------------------------------------------------------------------- |
| Phase 4 で rename 漏れ            | ts-morph / IDE rename で機械的に。`grep` で旧名残存をチェック              |
| Phase 4 cross-schema FK の生成順  | Prisma migrate に任せ、生成 SQL を目視レビュー                             |
| Phase 3 でフロント書き換え漏れ    | 全 21 ファイルを 1 PR にまとめ、grep で旧 path 残存をチェック              |
| Phase 6 shadow DB 名              | `prisma.config.ts` で環境変数化                                            |
| ESLint config 肥大化              | `eslint.config.js` を機能別に分割（`overrides` セクション化）              |
| Phase 4 + 5 の migration が巨大化 | 1 migration にまとめる（rename → @@schema → @@map → @@index を一気に適用） |

---

## 進捗管理

各 Phase の進捗は本ファイルの「Phase 構成」内ステータスで管理する。Phase 単位で PR を切り、完了時に以下を更新：

- [ ] Phase 0: 規約整備 + 防御線
- [ ] Phase 1: 不要 API・モデル削除
- [ ] Phase 2: DDD 違反解消
- [ ] Phase 3: REST API 再設計 — **本体実装完了 (2026-05-11)**。zod-to-openapi / read 系統一はバックログへ
- [ ] Phase 4: スキーマ・命名統一
- [ ] Phase 5: Index 補強
- [ ] Phase 6: DB 名変更
- [ ] Phase 7: ディレクトリ統一

## 関連ファイル

- 評価ファイル群: `00_overview.md` + `01_*.md` 〜 `09_*.md`
- 主スキーマ: `backend/prisma/schema.prisma`
- DI 中枢: `backend/src/api/_usecaseFactory.ts`
- フロント API クライアント: `frontend/src/features/*/api/*.ts`（21 ファイル）
