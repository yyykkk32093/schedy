# Phase 5: 高度 Web 機能 + 外部連携 — 進捗

> **最終更新**: 2026-03-06
> **ステータス**: 🚧 作業中

> Capacitor 除去、投票/アンケート、LINE Webhook 連携

## タスク一覧

| #   | タスク                             | UBL    | ステータス | レイヤ   |
| --- | ---------------------------------- | ------ | ---------- | -------- |
| 5-1 | FE Capacitor コード・依存の除去    | UBL-36 | ✅ 完了     | FE       |
| 5-2 | 投票/アンケート機能                | UBL-34 | ✅ 完了     | DB/BE/FE |
| 5-3 | LINE 通知連携（Webhook）           | UBL-29 | ✅ 完了     | DB/BE/FE |
| 5-4 | off_session 課金失敗時プッシュ通知 | UBL-28 | ⏸️ スキップ | BE       |

## 設計メモ

### UBL-36: Capacitor 除去
- `@capacitor/core`, `@capacitor/cli` 削除
- `capacitor.config.ts` 削除
- `frontend/src/adapters/capacitor/` ディレクトリ全削除
- `platformDetect.ts` を Web-only に簡素化（将来: LIFF/ネイティブアプリ分岐）
- バックエンド auth コメントの "Capacitor" → "LIFF / ネイティブアプリ" 更新

### UBL-34: 投票/アンケート
- **DB**: `Poll`, `PollOption`, `PollVote` モデル追加（migration: `20260306130103_add_poll_and_webhook`）
- **BE ドメイン**: `Poll`（AggregateRoot, 2-20選択肢）、`PollOption`、ValueObject群
- **BE アプリ**: `CreatePollUseCase`（UoW + NotificationService）、`CastVoteUseCase`、`GetPollResultUseCase`、`ListPollsUseCase`、`DeletePollUseCase`
- **BE API**: `POST /v1/communities/:communityId/polls`、`GET /v1/communities/:communityId/polls`、`GET /v1/polls/:id`、`POST /v1/polls/:id/vote`、`DELETE /v1/polls/:id`
- **FE**: `PollCreateForm`（動的選択肢、複数選択トグル、締切設定）、`PollResultChart`（recharts 横棒グラフ + 投票UI + プログレスバー）
- **AnnouncementCreatePage**: `SectionTabs` でお知らせ/投票タブ化（ステート管理、同一パス）
- **ルートタイトル**: 「お知らせ作成」→「投稿作成」に変更

### UBL-29: LINE Webhook
- **DB**: `CommunityWebhookConfig` モデル追加（同 migration）
- **BE**: `LineWebhookIntegrationHandler`（IntegrationHandler 継承、`webhook.line` routingKey）
- **Outbox 連携**: `CreateAnnouncementUseCase` / `CreatePollUseCase` 内で webhook 用 OutboxEvent を同一 TX に挿入
- **BE API**: `PUT /v1/communities/:communityId/webhooks`（UPSERT）、`GET /v1/communities/:communityId/webhooks`、`DELETE /v1/communities/:communityId/webhooks/:configId`
- **FE**: `WebhookSettings` コンポーネント → コミュニティ設定画面「外部連携」セクションに統合
- **RetryPolicy**: `webhook.line`（maxRetries=3, baseInterval=5s, maxInterval=30s）

### UBL-28: off_session（スキップ）
- Stripe off_session 課金失敗時のプッシュ通知
- 現時点で Stripe の off_session フローが未実装のため、スキップ

## Mockup

- なし（バックログ系タスク）

## 変更対象ファイル

### データベース
- `backend/prisma/schema.prisma` — Poll, PollOption, PollVote, CommunityWebhookConfig 追加
- `backend/infra/database/seeds/outbox-retry-policy.sql` — `webhook.line` シード追加

### バックエンド（新規）
- `backend/src/domains/poll/` — ドメインモデル一式
- `backend/src/application/poll/` — UseCase 5件 + エラー2件
- `backend/src/api/front/poll/` — Controller + Routes
- `backend/src/domains/webhook/` — Repository IF + Prisma 実装
- `backend/src/application/webhook/` — UseCase 3件
- `backend/src/api/front/webhook/` — Controller + Routes
- `backend/src/integration/dispatcher/handler/LineWebhookIntegrationHandler.ts`

### バックエンド（更新）
- `backend/src/api/_usecaseFactory.ts` — Poll 5件 + Webhook 3件の Factory 追加
- `backend/src/_bootstrap/IntegrationDispatcherRegistrar.ts` — `webhook.line` Handler 登録
- `backend/src/application/announcement/usecase/CreateAnnouncementUseCase.ts` — webhook OutboxEvent 追加
- `backend/src/application/poll/usecase/CreatePollUseCase.ts` — webhook OutboxEvent 追加

### フロントエンド（新規）
- `frontend/src/features/poll/` — API, hooks, PollCreateForm, PollResultChart
- `frontend/src/features/webhook/` — API, hooks, WebhookSettings

### フロントエンド（更新）
- `frontend/src/features/announcement/pages/AnnouncementCreatePage.tsx` — タブ UI 統合
- `frontend/src/features/community/pages/CommunitySettingsPage.tsx` — 外部連携セクション追加
- `frontend/src/shared/lib/queryKeys.ts` — pollKeys, webhookKeys 追加
- `frontend/src/app/App.tsx` — ルートタイトル変更
- `frontend/src/app/platformDetect.ts` — Capacitor 除去

### フロントエンド（削除）
- `frontend/capacitor.config.ts`
- `frontend/src/adapters/capacitor/`

## 作業ログ

- 2026-03-06: UBL-36 完了（Capacitor 全除去）、UBL-34 完了（投票機能 フルスタック実装）、UBL-29 完了（LINE Webhook 連携）、UBL-28 スキップ判定。Slack/Discord は Ideabox（I-5, I-6）に移管。
