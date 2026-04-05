# Backlog Phase 1: コア機能補完 — 進捗

> **最終更新**: 2026-03-06
> **ステータス**: ✅ 完了
> **テーマ**: 既存インフラで完結する機能補完（Announcement ソーシャル機能 + 参加・支払い機能 + アルバムBE）
> **前提条件**: なし（独立して実装可能）

---

## タスク一覧

### Announcement ソーシャル機能

| UBL   | タスク                       | レイヤ         | ステータス | 備考                                                                              |
| ----- | ---------------------------- | -------------- | ---------- | --------------------------------------------------------------------------------- |
| UBL-1 | いいね機能（Announcement）   | DB/BE/FE       | ✅ 完了     | `AnnouncementLike` テーブル + toggle API + FeedCard ❤️ ボタン（Optimistic Update） |
| UBL-2 | コメント機能（Announcement） | DB/BE/FE       | ✅ 完了     | `AnnouncementComment` テーブル + CRUD API + CommentSection コンポーネント         |
| UBL-3 | 画像添付機能（Announcement） | DB/BE/FE/Infra | ✅ 完了     | `AnnouncementAttachment` テーブル + フィード画像カルーセル + 既存 /v1/upload 連携 |

### Home画面・ヘッダー強化

| UBL   | タスク                            | レイヤ | ステータス | 備考                                                                       |
| ----- | --------------------------------- | ------ | ---------- | -------------------------------------------------------------------------- |
| UBL-4 | Home画面 検索バー                 | BE/FE  | ✅ 完了     | searchByKeyword API + SearchBar（デバウンス300ms）+ HomePage 統合          |
| UBL-5 | ヘッダー プロフィールアバター追加 | FE     | ✅ 完了     | AppLayout ヘッダー右上にユーザーアバター表示（shadcn/ui Avatar + useAuth） |

### アルバム機能

| UBL   | タスク                                    | レイヤ         | ステータス | 備考                                                         |
| ----- | ----------------------------------------- | -------------- | ---------- | ------------------------------------------------------------ |
| UBL-6 | アルバム機能（API + DB + フロントUI連携） | DB/BE/FE/Infra | ✅ 完了     | Album/AlbumPhoto テーブル + CRUD API + AlbumTab（2階層ナビ） |

### 参加 + 支払い機能

> 2026-03-05 設計決定済み。詳細は `backlog-overview.md` の「設計決定事項」セクション参照

| UBL   | タスク                                             | レイヤ   | ステータス | 備考               |
| ----- | -------------------------------------------------- | -------- | ---------- | ------------------ |
| UBL-7 | 参加 + 支払い SplitButton（参加機能連携）          | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |
| UBL-8 | 支払い機能（PayPay/Stripe/現金 Strategy パターン） | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |

**UBL-7 サブタスク（参加 + SplitButton）:**

| #   | サブタスク                                             | レイヤ | ステータス | 備考                                                                           |
| --- | ------------------------------------------------------ | ------ | ---------- | ------------------------------------------------------------------------------ |
| 7-1 | SplitButton コンポーネント（JoinButton）               | FE     | ✅ 完了     | 有料: ドロップダウン付き（現金/PayPay）。無料: 通常ボタン                      |
| 7-2 | Participation API 拡張（paymentMethod パラメータ追加） | BE     | ✅ 完了     | `POST /v1/participations` に `paymentMethod` を追加                            |
| 7-3 | Participation モデルに支払いカラム追加                 | DB     | ✅ 完了     | `paymentMethod`, `paymentStatus`, `paymentReportedAt`, `paymentConfirmedAt` 等 |

**UBL-8 サブタスク（支払い Strategy パターン）:**

| #    | サブタスク                                         | レイヤ | ステータス | 備考                                                                                                     |
| ---- | -------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| 8-1  | PaymentMethod / PaymentStatus Enum 追加            | DB     | ✅ 完了     | ValueObject実装: PaymentMethod (CASH/PAYPAY/STRIPE) + PaymentStatus (UNPAID/REPORTED/CONFIRMED/REJECTED) |
| 8-2  | PaymentStrategy インターフェース + Factory         | BE     | ✅ 完了     | Strategy パターン。IPaymentStrategy + PaymentStrategyFactory                                             |
| 8-3  | CashStrategy 実装                                  | BE     | ✅ 完了     | canReportPayment=true, requiresAdminConfirmation=true                                                    |
| 8-4  | PayPayStrategy 実装 + PayPay 送金フロー UI         | BE/FE  | ✅ 完了     | canReportPayment=true, requiresAdminConfirmation=true。PayPay UI は Phase 5 で拡張予定                   |
| 8-5  | StripeStrategy 実装                                | BE     | ✅ 完了     | canReportPayment=false, requiresAdminConfirmation=false。FE動線は初期クローズ                            |
| 8-6  | 支払い完了報告 API                                 | BE     | ✅ 完了     | `PATCH /v1/participations/:id/report-payment` 実装済み + FE hooks                                        |
| 8-7  | 管理者 支払い確認/却下 API                         | BE     | ✅ 完了     | `PATCH /v1/participations/:id/confirm-payment` 実装済み + FE hooks                                       |
| 8-8  | 管理者 参加者一覧 支払い状況表示                   | FE     | ✅ 完了     | ScheduleDetailPage に参加者一覧 + 支払いステータス + 確認ボタン表示                                      |
| 8-9  | 報告忘れリマインドバナー                           | FE     | ⏭️ Phase5   | PayPay 詳細UIと合わせて Phase 5 で実装予定                                                               |
| 8-10 | PaymentFeeCalculator ドメインクラス                | BE     | ⏭️ Phase5   | Stripe 有効化時に実装予定                                                                                |
| 8-11 | Stripe 手数料アラートダイアログ（StripeFeeDialog） | FE     | ⏭️ Phase5   | Stripe 有効化時に実装予定                                                                                |

---

## 実装順序（推奨）

1. **UBL-5**（ヘッダーアバター）— FE のみで完結、最小工数
2. **UBL-8**（支払い機能 Strategy）— DB Enum + Strategy パターン + PayPay/Cash 実装。Stripe は BE のみ実装し FE 動線は閉じる
3. **UBL-7**（参加 SplitButton）— UBL-8 の基盤の上に SplitButton UI を構築
4. **UBL-1 → UBL-2 → UBL-3**（Announcement ソーシャル機能）— DB設計 → API → FE の順で3機能を一括実装
5. **UBL-4**（検索バー）— 検索API新設が必要
6. **UBL-6**（アルバムBE）— S3連携を含む最大工数タスク

---

## 技術メモ

- **Step 0 既存 Stripe スキャフォールド削除**: `SchedulePayment` / `StripeConnectAccount` テーブル + Payment UseCase 8本 + API 7エンドポイント + Repository 2ファイル + FE `features/payment/` を削除。マイグレーション `remove_stripe_connect_schedule_payment` 実行済み。`IStripeService` / `StripeServiceImpl` は Phase 5（UBL-24）再利用のため保持。`PaywallPage` を `features/billing/pages/` に移動（RevenueCat はBilling ドメイン）
- **UBL-1〜3 の DB 設計**: `AnnouncementLike` / `AnnouncementComment` テーブルは Prisma schema に追加し、マイグレーション実行
- **UBL-3 / UBL-6 の S3 連携**: 既存の LocalStack S3 設定（`infra/localstack/init-s3.sh`）を活用
- **UBL-7 SplitButton**: shadcn/ui の `Button` + `DropdownMenu` を組み合わせ。有料（`fee > 0`）の場合のみドロップダウン表示、無料は通常ボタン
- **UBL-8 DB 設計**: Participation テーブルに `paymentMethod`（Enum: CASH/PAYPAY/STRIPE）、`paymentStatus`（Enum: UNPAID/REPORTED/CONFIRMED/REJECTED）、`paymentReportedAt`、`paymentConfirmedAt`、`paymentConfirmedBy`、`stripePaymentIntentId` を追加。Community テーブルに `payPayId`（String?）、`enabledPaymentMethods`（PaymentMethod[]）を追加。Schedule テーブルに `fee`（Int?）を追加
- **UBL-8 Strategy パターン**: `PaymentStrategy` インターフェースを Domain 層に配置。`CashStrategy`（追跡なし）/ `PayPayStrategy`（手動報告）/ `StripeStrategy`（Webhook 自動確認）を実装。`PaymentStrategyFactory` で PaymentMethod → Strategy を解決
- **Stripe 動線の閉じ方**: `Community.enabledPaymentMethods` の初期値を `[CASH, PAYPAY]` にし、Stripe をデフォルト無効化。BE 側の StripeStrategy コードは残す。将来 Stripe を有効化する場合は配列に `STRIPE` を追加するだけ
- **PayPay 個人間送金の制約**: API なし・コールバックなし・金額プリセット不可。PayPay ID + 金額のコピーボタン + `paypay://` ディープリンクでアプリ起動が最善策
- **冪等性**: Participation テーブルの `(scheduleId, userId)` 複合ユニーク制約で二重報告を防止
- **UBL-8 PaymentFeeCalculator**: Domain 層に配置する値オブジェクト / ユーティリティクラス。Stripe 手数料率 3.6% の逆算で `totalCharge = Math.ceil(baseFee / (1 - 0.036))`。返却値: `{ baseFee, stripeFee, totalCharge }`。手取り額 = baseFee を保証（手数料はユーザー負担）
- **UBL-8 StripeFeeDialog**: shadcn/ui `Dialog` コンポーネント。SplitButton で「クレジットカード」選択時にモーダル表示。内訳テーブル（参加費 / 手数料 / 合計）を提示し、「PayPayに変更」ボタン（PayPay フローに遷移）と「この金額で決済に進む」ボタン（Stripe Checkout へ）を配置。ユーザーに手数料を明示して納得の上で決済させる UX

---

## 作業ログ

- 2026-03-04: バックログ統合時に Backlog Phase 1 として編成（旧 FE BL-1〜6, BL-11, BL-12）
- 2026-03-05: 支払い機能の設計を決定。UBL-7 を SplitButton（参加+支払い方法選択）に変更、UBL-8 を Strategy パターンによる PayPay/Stripe/現金の抽象化に変更。PayPay は個人間送金（手数料0・手動報告）、Stripe は Webhook 自動確認、現金はシステム追跡なし or 管理者入力。Stripe の FE 動線は enabledPaymentMethods で初期クローズ
- 2026-03-05: Stripe 手数料ユーザー負担方針を追加。PaymentFeeCalculator（逆算ロジック）+ StripeFeeDialog（手数料アラートダイアログ + PayPay 変更導線）をサブタスク 8-10 / 8-11 として追加
- 2026-03-05: Step 0 完了 — 既存 Stripe Connect スキャフォールド削除。SchedulePayment / StripeConnectAccount テーブル削除 + Payment UseCase 8本 + API + Repository + FE payment/ 削除。IStripeService / StripeServiceImpl は Phase 5 再利用のため保持。PaywallPage を features/billing/ に移動
- 2026-03-05: UBL-5 完了 — AppLayout ヘッダーにプロフィールアバター追加（shadcn/ui Avatar + useAuth の avatarUrl / displayName 利用）
- 2026-03-06: **Phase 1 全タスク完了** — UBL-1〜8 一括実装
  - **Prisma**: マイグレーション `backlog_ph1_payment_social_album` — Participation 支払いフィールド、Community 支払い設定、AnnouncementLike/Comment/Attachment、Album/AlbumPhoto テーブル追加
  - **UBL-8 BE**: PaymentMethod/PaymentStatus VO、Strategy パターン（IPaymentStrategy → Cash/PayPay/Stripe + Factory）、Participation エンティティ支払いメソッド拡張、ReportPayment/ConfirmPayment UseCase、API エンドポイント
  - **UBL-7 FE**: ScheduleDetailPage に SplitButton（有料時: 現金/PayPay 選択ドロップダウン付き参加ボタン）、参加者一覧に支払状況表示 + 報告/確認ボタン
  - **UBL-1 BE/FE**: AnnouncementLikeRepository + ToggleLikeUseCase + API、FeedCard にハートボタン（Optimistic Update）
  - **UBL-2 BE/FE**: AnnouncementCommentRepository + CRUD UseCase + API、CommentSection コンポーネント
  - **UBL-3 BE/FE**: AnnouncementAttachment DB + フィード include、FeedCard 画像カルーセル
  - **UBL-4 BE/FE**: searchByKeyword リポジトリメソッド + SearchAnnouncementsUseCase + API、SearchBar コンポーネント（デバウンス300ms）+ HomePage 統合
  - **UBL-6 BE/FE**: Album/AlbumPhoto リポジトリ + 5 UseCase + API、AlbumTab 完全実装（アルバム一覧 → 写真グリッド 2階層ナビ + 写真アップロード）
  - **BE tsc**: ゼロエラー。**FE tsc**: ゼロエラー
