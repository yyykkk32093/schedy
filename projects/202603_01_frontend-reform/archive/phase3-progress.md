# 📋 Phase 3 実装進捗トラッカー — 課金 + 機能制限

> **最終更新**: 2026-02-14
> **ベース**: [memo.md](memo.md) の Phase 3 計画
> **対象**: FeatureGate + サブスクリプション決済 + 参加費決済
> **ステータス**: ✅ バックエンド全層完了 / ✅ フロントエンド UI 完了（Web版）

---

## 確定済み設計方針

### 全体決定事項

| 項目                   | 決定値                                                                           | 決定日     |
| ---------------------- | -------------------------------------------------------------------------------- | ---------- |
| サブスク月額           | **320円**                                                                        | 2026-02-10 |
| LIFETIME 価格          | **5,980円**（年1回限定販売）                                                     | 2026-02-10 |
| サブスク決済プロバイダ | **RevenueCat**（`IBillingService` インターフェースで抽象化）                     | 2026-02-10 |
| 参加費決済プロバイダ   | **Stripe Connect Express**（`PaymentGatewayPort` で抽象化）                      | 2026-02-10 |
| 参加費支払い方法       | Apple Pay / Card / PayPay（Stripe経由、拡張可能）                                | 2026-02-10 |
| カスタムスタンプ上限   | SUBSCRIBER = **100**                                                             | 2026-02-10 |
| 参加コミュニティ数     | SUBSCRIBER = **-1（無制限）**（FeatureGateで将来制御可）                         | 2026-02-10 |
| seed 配置場所          | `backend/infra/database/seeds/`                                                  | 2026-02-10 |
| プラットフォーム手数料 | **0円**（`application_fee_amount = ceil(amount×0.036)`、Stripe手数料パススルー） | 2026-02-11 |
| Stripe課金方式         | **Destination Charges**（OWNER受取=額面-3.6%、Schedy±0）                         | 2026-02-11 |
| 支払いタイミング       | **ユーザー手動**（「支払う」ボタン押下時のみ、自動課金なし）                     | 2026-02-11 |
| Stripe Customer        | **不要**（毎回on-sessionワンタイム決済）                                         | 2026-02-11 |
| 返金条件               | Schedule開始後**5日以内**キャンセルで全額返金                                    | 2026-02-11 |
| `on_behalf_of`         | **未設定**（Schedy名義。明細: `SCHEDY* コミュニティ名`）                         | 2026-02-11 |
| 参加と支払いの関係     | **独立**（制約なし。いつでも支払い可能）                                         | 2026-02-11 |
| OWNER/管理者画面       | **参加者一覧 + 支払いステータスバッジ**（✅支払済 / ⚠️未払い / ↩️返金済）           | 2026-02-11 |

### 手数料モデル詳細（Model E: Stripe手数料パススルー）

```
参加者が 1,000円 の Schedule に参加:
  application_fee_amount = ceil(1000 × 0.036) = 36円
  → OWNER受取: 1,000 - 36 = 964円
  → Schedy: 36 - 36(Stripe手数料) = ±0円
  → Stripe手数料はOWNER負担（振込額から天引き）
```

---

## 3-1. FeatureGate 基盤 ✅ 完了

| タスク                                                     | 状態     | 備考                                                 |
| ---------------------------------------------------------- | -------- | ---------------------------------------------------- |
| 4テーブル作成（UserFeature/Limit, CommunityFeature/Limit） | ✅ 完了   | Prisma スキーマ + マイグレーション                   |
| Feature enum（個人向け機能の列挙）                         | ✅ 完了   | 型安全。_sharedDomains に配置                        |
| CommunityFeature enum（コミュニティ向け）                  | ✅ 完了   | 型安全。_sharedDomains に配置                        |
| seed 投入（初期制限データ）                                | ✅ 完了   | memo.md §5 の制限マトリクスに基づく（60レコード）    |
| FeatureGateService（インメモリキャッシュ + TTL）           | ✅ 完了   | DB変更 → キャッシュリフレッシュ → 即反映             |
| `requireFeature` / `requireLimit` middleware               | ✅ 完了   | 403 返却                                             |
| `/v1/auth/me` 拡張（plan + features + limits）             | ✅ 完了   | フロントへの機能マッピング配信                       |
| 既存 hardcoded plan check 置換                             | ✅ 完了   | dmRoutes.ts, stampRoutes.ts の直書きを middleware 化 |
| Frontend: AuthMeResponse 拡張 + useFeatureGate hook        | ✅ 完了   |                                                      |
| Frontend: AppLayout + BottomNav                            | ✅ 完了   | Phase 2 で未実装の Navigation                        |
| Frontend: Chat ボタン追加                                  | ✅ 完了   | CommunityDetail, ActivityDetail                      |
| Community `logoUrl` / `coverUrl`（PREMIUM 限定）           | ❌ 未着手 | Phase 1 で後回しにした機能。FeatureGate で制御       |

---

## 3-2. サブスクリプション決済 ✅ バックエンド完了

| タスク                                  | 状態   | 備考                                                                              |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `IBillingService` インターフェース定義  | ✅ 完了 | `integration/billing/IBillingService.ts`                                          |
| `RevenueCatBillingService` 実装         | ✅ 完了 | `integration/billing/RevenueCatBillingService.ts`                                 |
| Webhook: `POST /v1/webhooks/revenuecat` | ✅ 完了 | `HandleRevenueCatWebhookUseCase` → User.plan 更新                                 |
| サブスク解約時の grade 降格処理         | ✅ 完了 | CANCELLATION/EXPIRATION → FREE（LIFETIME は降格不可ガード付き）                   |
| AppSecretsLoader: RevenueCat 設定追加   | ✅ 完了 | `getRevenueCat()` メソッド + `loadFromEnv` / `loadFromSecretsManager`             |
| Frontend: Paywall UI                    | ✅ 完了 | `PaywallPage.tsx` — プラン比較テーブル（Web版は「アプリからアップグレード」案内） |

---

## 3-3. 買い切りプラン（年1回限定販売） ✅ バックエンド完了

| タスク                               | 状態     | 備考                                                               |
| ------------------------------------ | -------- | ------------------------------------------------------------------ |
| Non-Consumable IAP（RevenueCat経由） | ✅ 完了   | RevenueCat Webhook の `NON_RENEWING_PURCHASE` で LIFETIME 適用     |
| 販売期間制御                         | ❌ 未着手 | 年1回限定（RevenueCat/Store側の設定で制御予定）                    |
| LIFETIME プラン適用ロジック          | ✅ 完了   | Webhook → User.plan = 'LIFETIME'、LIFETIME→FREE 降格不可ガード付き |

---

## 3-4. 参加費決済（Stripe Connect Express） ✅ 全層完了

| タスク                                           | 状態   | 備考                                                                   |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------------- |
| Prisma: StripeConnectAccount テーブル            | ✅ 完了 | マイグレーション済み                                                   |
| Prisma: SchedulePayment テーブル                 | ✅ 完了 | マイグレーション済み                                                   |
| Prisma: Schedule.participationFee カラム         | ✅ 完了 | Int? (null=無料) + Entity/Repo/UseCase/Controller 全層貫通             |
| `IStripeService` インターフェース                | ✅ 完了 | `integration/stripe/IStripeService.ts`                                 |
| `StripeServiceImpl` 実装                         | ✅ 完了 | Destination Charges + `ceil(amount×0.036)` 手数料                      |
| AppSecretsLoader: Stripe 設定追加                | ✅ 完了 | `getStripe()` メソッド + `loadFromEnv` / `loadFromSecretsManager`      |
| Repository: StripeConnectAccountRepository       | ✅ 完了 | `domains/payment/infrastructure/repository/`                           |
| Repository: SchedulePaymentRepository            | ✅ 完了 | `domains/payment/infrastructure/repository/`                           |
| UseCase: StartStripeOnboardingUseCase            | ✅ 完了 | OWNER権限チェック + Connect Express アカウント作成 + Account Link 生成 |
| UseCase: GetStripeConnectStatusUseCase           | ✅ 完了 | Stripe API からステータス同期 + DB更新                                 |
| UseCase: GetStripeDashboardLinkUseCase           | ✅ 完了 | Login Link 生成                                                        |
| UseCase: CreatePaymentIntentUseCase              | ✅ 完了 | PaymentIntent 作成 + SchedulePayment PENDING レコード作成              |
| UseCase: ListSchedulePaymentsUseCase             | ✅ 完了 | スケジュール毎の支払い一覧                                             |
| UseCase: GetMyPaymentStatusUseCase               | ✅ 完了 | ユーザー自身の支払いステータス取得                                     |
| UseCase: RefundPaymentUseCase                    | ✅ 完了 | Schedule開始後5日以内 + 本人のみ → 全額返金                            |
| UseCase: HandleStripeWebhookUseCase              | ✅ 完了 | payment_intent.succeeded / failed / charge.refunded                    |
| API: OWNER用 Connect 3エンドポイント             | ✅ 完了 | POST onboarding, GET status, GET dashboard                             |
| API: `POST /v1/schedules/:id/payment-intent`     | ✅ 完了 | PaymentIntent 作成 → client_secret 返却                                |
| API: `GET /v1/schedules/:id/payments`            | ✅ 完了 | 支払い一覧（OWNER向け）                                                |
| API: `GET /v1/schedules/:id/my-payment`          | ✅ 完了 | 自分の支払いステータス                                                 |
| API: `POST /v1/payments/:id/refund`              | ✅ 完了 | 返金                                                                   |
| API: `POST /v1/stripe/webhooks`                  | ✅ 完了 | raw body (server.ts 修正), Stripe署名検証                              |
| usecaseFactory 拡張                              | ✅ 完了 | 8つの Payment UseCase ファクトリ追加                                   |
| Frontend: API型定義                              | ✅ 完了 | api.ts に 7型追加                                                      |
| Frontend: paymentApi クライアント                | ✅ 完了 | `features/payment/api/paymentApi.ts`                                   |
| Frontend: usePaymentQueries hooks                | ✅ 完了 | 7つの TanStack Query hooks                                             |
| Frontend: queryKeys 追加                         | ✅ 完了 | stripeConnectKeys, paymentKeys, paymentListKeys, myPaymentKeys         |
| Frontend OWNER: オンボーディング UI ページ       | ✅ 完了 | CommunityDetailPage に Stripe Connect セクション追加（`window.open`）  |
| Frontend OWNER: 参加者一覧 + 支払いバッジ        | ✅ 完了 | ScheduleDetailPage に追加（`useParticipantsWithPayment` フック）       |
| Frontend 参加者: 「支払う」ボタン + PaymentSheet | ✅ 完了 | `PaymentModal` — Stripe `PaymentElement`（Web版モーダル表示）          |

---

## 3-5. 外部サービス設定手順書 ✅ 完了

| タスク                         | 状態   | 備考                                                                          |
| ------------------------------ | ------ | ----------------------------------------------------------------------------- |
| `cloudservice-setting.md` 作成 | ✅ 完了 | Stripe/RevenueCat/AppStore/GooglePlay 設定手順 + AWS Secrets Manager JSON構造 |

---

## Phase 5 に後回しした項目

| 項目                               | 元の Phase | 理由                                       |
| ---------------------------------- | ---------- | ------------------------------------------ |
| off_session 課金失敗時プッシュ通知 | 3 (参加費) | 手動支払いに変更。将来自動課金導入時に必要 |
| 支払い催促通知（自動リマインド）   | 3 (参加費) | MVP に不要。将来プッシュ通知基盤と共に実装 |

---

## 前提条件

- Phase 1 完了済み ✅
- Phase 2 完了済み ✅（85 tests / 12 files, both builds clean）
- Batch 3-A (FeatureGate) 完了済み ✅（95 tests, both builds clean）
- Batch 3-D/B/C (Stripe + RevenueCat + LIFETIME) バックエンド完了 ✅（10 unit passed, both builds clean）
- Phase 3 Frontend UI 完了 ✅（ScheduleDetail/List, CommunityDetail, PaywallPage — both builds clean）

---

## 作成ファイル一覧（Phase 3 で新規作成）

### バックエンド

| ファイル                                                                      | 説明                               |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| `integration/stripe/IStripeService.ts`                                        | Stripe 操作ポートインターフェース  |
| `integration/stripe/StripeServiceImpl.ts`                                     | Stripe SDK 実装                    |
| `integration/billing/IBillingService.ts`                                      | 課金サービスポートインターフェース |
| `integration/billing/RevenueCatBillingService.ts`                             | RevenueCat 実装                    |
| `domains/payment/infrastructure/repository/StripeConnectAccountRepository.ts` | Connect アカウントリポジトリ       |
| `domains/payment/infrastructure/repository/SchedulePaymentRepository.ts`      | 支払いリポジトリ                   |
| `application/payment/usecase/StartStripeOnboardingUseCase.ts`                 | オンボーディング                   |
| `application/payment/usecase/GetStripeConnectStatusUseCase.ts`                | ステータス取得                     |
| `application/payment/usecase/GetStripeDashboardLinkUseCase.ts`                | ダッシュボードリンク               |
| `application/payment/usecase/CreatePaymentIntentUseCase.ts`                   | PaymentIntent作成                  |
| `application/payment/usecase/ListSchedulePaymentsUseCase.ts`                  | 支払い一覧                         |
| `application/payment/usecase/GetMyPaymentStatusUseCase.ts`                    | 自分の支払いステータス             |
| `application/payment/usecase/RefundPaymentUseCase.ts`                         | 返金                               |
| `application/payment/usecase/HandleStripeWebhookUseCase.ts`                   | Stripe Webhook処理                 |
| `application/billing/usecase/HandleRevenueCatWebhookUseCase.ts`               | RevenueCat Webhook処理             |
| `application/participation/usecase/ListParticipationsUseCase.ts`              | 参加者一覧取得（読み取り専用）     |
| `api/front/payment/controllers/stripeConnectController.ts`                    | Connect APIコントローラ            |
| `api/front/payment/controllers/paymentController.ts`                          | 支払いAPIコントローラ              |
| `api/front/payment/routes/paymentRoutes.ts`                                   | 支払いルート (7エンドポイント)     |
| `api/integration/stripe/controllers/stripeWebhookController.ts`               | Stripe Webhookコントローラ         |
| `api/integration/stripe/routes/stripeWebhookRoutes.ts`                        | Stripe Webhookルート               |
| `api/integration/billing/controllers/revenueCatWebhookController.ts`          | RevenueCat Webhookコントローラ     |
| `api/integration/billing/routes/billingWebhookRoutes.ts`                      | RevenueCat Webhookルート           |

### フロントエンド

| ファイル                                               | 説明                                                   |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `features/payment/api/paymentApi.ts`                   | 支払い系APIクライアント                                |
| `features/payment/hooks/usePaymentQueries.ts`          | TanStack Query hooks (7個)                             |
| `features/payment/hooks/useParticipantsWithPayment.ts` | 参加者×支払い結合カスタムフック（2API並列+userId結合） |
| `features/payment/components/PaymentModal.tsx`         | Stripe PaymentElement モーダル                         |
| `features/payment/pages/PaywallPage.tsx`               | プラン比較テーブル（FREE/SUBSCRIBER/LIFETIME）         |

### ドキュメント

| ファイル                  | 説明                                             |
| ------------------------- | ------------------------------------------------ |
| `cloudservice-setting.md` | Stripe/RevenueCat/AppStore/GooglePlay 設定手順書 |

### 変更ファイル一覧（既存ファイルの修正）

| ファイル                                                                        | 変更内容                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `_sharedTech/config/AppSecretsLoader.ts`                                        | StripeConfig / RevenueCatConfig 型追加、getStripe() / getRevenueCat() メソッド追加          |
| `domains/activity/schedule/domain/model/entity/Schedule.ts`                     | participationFee フィールド追加                                                             |
| `domains/activity/schedule/infrastructure/repository/ScheduleRepositoryImpl.ts` | participationFee save/toDomain                                                              |
| `application/schedule/usecase/CreateScheduleUseCase.ts`                         | participationFee 入力/生成                                                                  |
| `application/schedule/usecase/UpdateScheduleUseCase.ts`                         | participationFee 入力/更新                                                                  |
| `application/schedule/usecase/FindScheduleUseCase.ts`                           | participationFee レスポンス                                                                 |
| `application/schedule/usecase/ListSchedulesUseCase.ts`                          | participationFee レスポンス                                                                 |
| `api/front/schedule/controllers/scheduleController.ts`                          | participationFee req.body                                                                   |
| `api/_usecaseFactory.ts`                                                        | Payment/Billing UseCase ファクトリ 9個追加                                                  |
| `api/server.ts`                                                                 | Stripe Webhook raw body パーサー追加                                                        |
| `env/.env.local`                                                                | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, REVENUECAT_API_KEY, REVENUECAT_WEBHOOK_AUTH_TOKEN |
| `frontend/src/shared/types/api.ts`                                              | Payment/Connect 7型追加 + participationFee                                                  |
| `frontend/src/shared/lib/queryKeys.ts`                                          | stripeConnectKeys, paymentKeys, paymentListKeys, myPaymentKeys, participationListKeys       |
| `frontend/src/features/schedule/pages/ScheduleDetailPage.tsx`                   | participationFee表示, 支払ステータスバッジ, PaymentModal, OWNER参加者一覧+返金              |
| `frontend/src/features/schedule/pages/ScheduleListPage.tsx`                     | 作成フォームに参加費入力欄, リストに¥バッジ表示                                             |
| `frontend/src/features/community/pages/CommunityDetailPage.tsx`                 | OWNER限定 Stripe Connect セクション追加                                                     |
| `frontend/src/app/App.tsx`                                                      | `/paywall` ルート追加                                                                       |
| `frontend/src/features/participation/api/participationApi.ts`                   | `list()` API追加                                                                            |
| `frontend/src/features/participation/hooks/useParticipationQueries.ts`          | `useParticipants` query hook追加, invalidation拡張                                          |
| `frontend/package.json`                                                         | `@stripe/stripe-js`, `@stripe/react-stripe-js` 追加                                         |
