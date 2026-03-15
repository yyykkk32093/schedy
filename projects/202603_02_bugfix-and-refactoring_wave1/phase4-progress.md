# Phase 4: 高度な新機能 — 進捗

> **最終更新**: 2026-03-12
> **ステータス**: ✅ 全タスク完了
> 設計検討が必要な大きめの機能

## タスク一覧

| #   | タスク                                                       | ステータス | 備考                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4-1 | カレンダーのドラッグ＆ドロップでアクティビティコピー/移動    | ✅ 完了     | @dnd-kit/core 導入。管理者以上のみD&D有効。コピー/移動/キャンセル 3択ダイアログ。DragOverlay + ドロップターゲットハイライト                                                                                      |
| 4-2 | Stripe 決済＋キャンセル時自動返金の実装                      | ✅ 完了     | 手数料4%（Stripe3.6%+アプリ0.4%）を参加者負担。`transfer_data.amount`でコミュニティ入金額を直接指定（詳細下記）                                                                                                  |
| 4-3 | APIエラーハンドリング全体見直し                              | ✅ 完了     | BE: 500エラーメッセージ隠蔽、FE: sonner + MutationCache.onError でグローバルトースト通知。エラーコード→日本語マッピング                                                                                          |
| 4-4 | PayPay支払い済みキャンセル→再参加時のリンク非表示対応        | ✅ 完了     | BE: history API新設、FE: PayPayリンク非表示+インフォメッセージ。個別エラー表示を削除（4-3のグローバルトーストに統合）                                                                                            |
| 4-5 | scheduleIdパススルー＋単一スケジュール表示＋繰り返し予定ナビ | ✅ 完了     | BE: ListActivities/CreateActivityにscheduleId追加。FE: 全ナビに?schedule=付与、ActivityDetailPage単一スケジュール表示（fallbackなし）、繰り返し予定ナビ（recurrenceRule時のみ）。ScheduleSection日時ヘッダー削除 |
| 4-6 | コミュニティ支払い設定に基づく決済手段の制御                 | ✅ 完了     | BE: FindActivityUseCaseにcommunityPaymentSettings追加。FE: 無効な支払い方法をdisabled表示+「管理者に問い合わせてください」。CommunitySettingsPageにクレジットカード(STRIPE)チェックボックス追加                  |
| 4-7 | Paymentテーブル分離＋UIクリーンアップ                        | ✅ 完了     | Paymentエンティティ分離、参加者テーブルに支払い方法/支払い列(adminのみ)、キャンセルボタンラベル変更、支払い方法表示                                                                                              |
| 4-8 | 返金管理UI（アクティビティ詳細＋コミュニティレベル）         | ✅ 完了     | BE: 3UseCase+2リポジトリメソッド+4APIエンドポイント。FE: RefundPendingSection(アクティビティ詳細)+RefundManagementPage(コミュニティレベル,2ビューモード)                                                         |

---

## 4-2: Stripe 決済＋キャンセル時自動返金 — 設計メモ

### 現状
- `StripePaymentStrategy` インターフェース定義済み、`refund()` メソッド未実装
- Stripe Connect (Destination Charges) の設定は済んでいる想定
- 支払い済みキャンセル時は確認ダイアログ表示 + 管理者通知（Phase 3 で実装済み）

### 決済方式: 手数料4%上乗せ（参加者負担）+ アプリ収益あり

> **方針**: 参加費に決済手数料4%を上乗せしてユーザーに請求する。
> 4%の内訳は Stripe 手数料 3.6% + アプリ手数料 0.4%。
> `transfer_data.amount` でコミュニティ入金額を参加費ぴったりに指定し、
> 残り（4% - 3.6% = 0.4%相当）をアプリ運営収益として受け取る。
> キャンセル時は参加費のみ返金し、手数料は返金対象外とする。
> ユーザーには「決済手数料4%」とだけ表示（内訳は出さない）。

### お金の流れ

```
参加費: 1,000円
手数料: 40円（4%）
ユーザー支払い: 1,040円

  ┌─────────────────────────────────┐
  │         Stripe                  │
  │  受取: 1,040円                  │
  │  Stripe手数料: -38円（3.6%）    │
  │  transfer → コミュニティ: 1,000円│ ← transfer_data.amount で直接指定
  │  残り → アプリ: 2円             │ ← 自動的にプラットフォームへ
  └─────────────────────────────────┘

コミュニティ入金: 1,000円 ✅（参加費ぴったり）
アプリ収益:          2円 ✅（0.4%相当）
Stripe手数料:       38円（3.6%）
合計: 1,000 + 2 + 38 = 1,040円 ✅
```

### なぜ `application_fee_amount` ではなく `transfer_data.amount` を使うか

| パラメータ                 | 動作                                              | 問題                                                               |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `application_fee_amount`   | アプリ取り分を指定 → 残りがコミュニティへ         | Stripe手数料の端数でコミュニティ入金が1円ずれる可能性              |
| **`transfer_data.amount`** | **コミュニティ入金額を直接指定** → 残りがアプリへ | **端数はアプリ側で吸収。コミュニティには必ず参加費ぴったり入金** ✅ |

```typescript
// ❌ application_fee_amount 方式（コミュニティ入金が端数でずれるリスク）
await stripe.paymentIntents.create({
  amount: 1040,
  application_fee_amount: 2, // アプリ取り分を指定
  transfer_data: { destination: communityAccountId },
});
// → Stripe手数料が38円ではなく37円だった場合、コミュニティに1001円入る（不安定）

// ✅ transfer_data.amount 方式（コミュニティ入金額を直接指定）
await stripe.paymentIntents.create({
  amount: 1040,
  transfer_data: {
    destination: communityAccountId,
    amount: 1000, // コミュニティに渡す額を直接指定
  },
});
// → コミュニティには必ず1,000円入金。Stripe手数料の端数はアプリ側で吸収
```

### 手数料計算ロジック（BE）

```typescript
const PLATFORM_FEE_RATE = 0.04; // 4%（Stripe 3.6% + アプリ 0.4%）

function calculatePaymentAmount(baseFee: number): {
  baseFee: number;          // 参加費（コミュニティ設定値 = コミュニティ入金額）
  platformFee: number;      // 手数料（ユーザー表示用）
  totalAmount: number;      // ユーザー支払い額
  transferAmount: number;   // Stripe transfer_data.amount（= baseFee）
  refundAmount: number;     // キャンセル時返金額
} {
  const platformFee = Math.ceil(baseFee * PLATFORM_FEE_RATE);
  const totalAmount = baseFee + platformFee;
  return {
    baseFee,
    platformFee,
    totalAmount,
    transferAmount: baseFee,   // コミュニティには参加費ぴったり
    refundAmount: baseFee,     // 返金も参加費のみ
  };
}
```

### 金額シミュレーション

| 参加費  | 手数料(4%) | 支払い額 | Stripe(3.6%) | コミュニティ入金 | アプリ収益 |
| ------- | ---------- | -------- | ------------ | ---------------- | ---------- |
| 500円   | 20円       | 520円    | 19円         | **500円**        | 1円        |
| 1,000円 | 40円       | 1,040円  | 38円         | **1,000円**      | 2円        |
| 2,000円 | 80円       | 2,080円  | 75円         | **2,000円**      | 5円        |
| 3,000円 | 120円      | 3,120円  | 113円        | **3,000円**      | 7円        |
| 5,000円 | 200円      | 5,200円  | 188円        | **5,000円**      | 12円       |

> コミュニティには**常に参加費ぴったり入金**。
> アプリ収益（0.4%相当）はStripe手数料の端数次第で±1円変動するが、常にプラス。
> 月1,000件決済 × 平均2,000円 → アプリ月収約5,000円。

### FE 注意喚起モーダル（参加時）

```
┌──────────────────────────────────────────┐
│  💳 クレジットカード決済について          │
│                                          │
│  参加費:     ¥1,000                      │
│  決済手数料: ¥40（4%）                   │
│  ───────────────────                     │
│  お支払い額: ¥1,040                      │
│                                          │
│  ⚠️ 決済手数料はキャンセル時に           │
│     返金されません                       │
│                                          │
│  [キャンセル]         [支払いに進む]     │
└──────────────────────────────────────────┘
```

### FE キャンセル確認モーダル（キャンセル時）

```
┌──────────────────────────────────────────┐
│  ⚠️ 参加をキャンセルしますか？            │
│                                          │
│  お支払い済み: ¥1,040                    │
│  返金額:       ¥1,000（参加費のみ）      │
│                                          │
│  ※ 決済手数料 ¥40 は返金されません      │
│                                          │
│  [戻る]              [キャンセルする]    │
└──────────────────────────────────────────┘
```

### 返金フロー

| ステップ           | 処理                                               | 金額             |
| ------------------ | -------------------------------------------------- | ---------------- |
| 1. 参加時決済      | Stripe に totalAmount を課金                       | 1,040円          |
| 2. Stripe分配      | コミュニティに transfer                            | 1,000円          |
| 3. Stripe分配      | アプリに残り（手数料差引後）                       | 2円              |
| 4. キャンセル→返金 | Stripe Partial Refund（baseFee のみ）              | 1,000円 返金     |
| 5. 返金後          | コミュニティから1,000円返金、アプリの2円はそのまま | アプリ損失なし ✅ |

> **注意**: Stripe の返金は transfer 元（コミュニティ側）から差し引かれる。
> Partial Refund で baseFee のみ返金するので、コミュニティ側も損失なし。
> アプリが受け取った収益（2円）は返金対象外。

### Stripe 返金の手数料に関する事実

| 項目                   | 内容                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| 返金処理手数料         | **無料**（Stripe は返金そのものに手数料を取らない）              |
| 元の決済手数料（3.6%） | **返却されない**（Stripe が保持）                                |
| アプリ収益（0.4%相当） | **返金対象外**（アプリが保持）                                   |
| コミュニティ           | キャンセル時は transfer 分（baseFee）が返金差引される → 損益ゼロ |

### 実装タスク

| #    | レイヤ | タスク                                                                                    | 工数 |
| ---- | ------ | ----------------------------------------------------------------------------------------- | ---- |
| S-1  | **BE** | 手数料計算ユーティリティ（4%方式 `calculatePaymentAmount`）実装 + 単体テスト              | 小   |
| S-2  | **BE** | `StripePaymentStrategy.charge()` — `transfer_data.amount = baseFee` で PaymentIntent 作成 | 中   |
| S-3  | **BE** | `StripePaymentStrategy.refund()` — baseFee のみ Partial Refund                            | 中   |
| S-4  | **BE** | `CancelParticipationUseCase` にて Stripe 支払い済みの場合に自動返金呼び出し               | 中   |
| S-5  | **BE** | `PaymentStatus` に `REFUNDED` / `REFUND_PENDING` ステータス追加                           | 小   |
| S-6  | **FE** | 参加時の決済確認モーダル（参加費 + 手数料4% + 合計額 + 注意文言）                         | 中   |
| S-7  | **FE** | キャンセル時の返金確認モーダル（返金額 + 手数料返金不可の注意文言）                       | 中   |
| S-8  | **FE** | Stripe 返金結果の表示（「返金処理中」「返金完了」）                                       | 小   |
| S-9  | **BE** | 手数料率を環境変数 or コミュニティ設定として外出し（将来変更可能に）                      | 小   |
| S-10 | **BE** | `POST /v1/webhooks/stripe` エンドポイント新設 + express.raw() ミドルウェア                | 中   |
| S-11 | **BE** | `charge.refunded` イベントハンドラ — PaymentStatus を REFUNDED に更新                     | 中   |
| S-12 | **BE** | `payment_intent.succeeded` イベントハンドラ — PaymentStatus を CONFIRMED に更新           | 中   |

### 前提条件
- Stripe Connect 本番設定が完了していること
- Stripe Webhook エンドポイント未実装 → S-10〜S-12 で対応
- StripeAdapter.constructEvent()（署名検証）✅ 実装済み
- STRIPE_WEBHOOK_SECRET ✅ AppSecretsLoader で読み込み済み

---

## 4-4: 支払い済みキャンセル → 再参加フロー — 現状分析 & 設計

### 現状フロー（コード調査結果 2026-03-11）

```
[参加] POST /v1/schedules/:id/participations
  ├─ paymentMethod あり → paymentStatus = UNPAID で新規作成
  └─ paymentMethod なし → paymentStatus = null（無料参加）

[支払い報告] PATCH /v1/participations/:id/report-payment
  └─ UNPAID → REPORTED

[管理者確認] PATCH /v1/participations/:id/confirm-payment
  └─ REPORTED → CONFIRMED

[キャンセル] DELETE /v1/schedules/:id/participations/me
  ├─ Participation レコードを物理削除
  ├─ ParticipationAuditLog に CANCELLED を記録
  │   └─ paymentMethod / paymentStatus のスナップショットを保存
  ├─ hasPaidPayment（REPORTED or CONFIRMED）なら管理者に PAID_CANCELLATION アラート
  └─ キャンセル待ち自動繰り上げ（空きが出た場合）

[再参加] POST /v1/schedules/:id/participations（同じAPI）
  └─ 完全新規作成: paymentStatus = UNPAID にリセット
     ⚠️ 以前の支払い状態は一切参照されない
```

### 支払い方法別の分析

| 支払い方法               | キャンセル時             | 返金の実態                                 | 再参加時の理想動作                                       | Phase 4 対応     |
| ------------------------ | ------------------------ | ------------------------------------------ | -------------------------------------------------------- | ---------------- |
| **CASH（現金）**         | 未払い状態でキャンセル   | 返金不要（当日現地払いなので金銭移動なし） | UNPAID で新規作成（現状通り）                            | **対応不要** ✅   |
| **STRIPE（クレジット）** | 決済済みでキャンセル     | Stripe Refund API で自動返金               | 自動返金＋再参加時に再決済（全自動）                     | **4-2 で対応**   |
| **PAYPAY**               | PayPayリンクで支払い済み | 手動返金（幹事⇔参加者間）                  | 支払い済み履歴あり → PayPayリンク非表示 + 案内メッセージ | **4-4 で対応** 🎯 |

### なぜ CASH は対応不要か

> 現金は「当日その場で払う」方式。参加ボタンを押した時点ではお金は動いていない。
> キャンセルしても返金の概念がない。再参加すれば当日また払えばよいだけ。

### PayPay の問題と対策

**問題**: PayPayリンクで支払い済み → キャンセル → 返金は手動 → 再参加時に再度 PayPayリンクが表示される（二重支払いリスク）

**対策**:
1. 再参加時に AuditLog を参照し、PayPay 支払い済みキャンセル履歴があるか確認
2. 履歴がある場合、PayPayリンク動線を非表示にする
3. 「前回のお支払いについては幹事にご確認ください」メッセージを表示
4. 管理者が返金確認後、既存の `confirm-payment` API で支払い状態を管理可能（専用UI不要）

### 実装タスク

| #   | レイヤ | タスク                                                                                                                                                 | 工数 |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| C-1 | **BE** | `GET /v1/schedules/:id/participations/me/history` API 新設 — AuditLog から直近のキャンセル記録（paymentMethod + paymentStatus スナップショット）を返却 | 中   |
| C-2 | **FE** | 再参加フローで history API を呼び出し、PayPay 支払い済みキャンセル履歴がある場合は PayPay リンク動線を非表示にする                                     | 中   |
| C-3 | **FE** | PayPay 支払い済みキャンセル → 再参加時に「前回のお支払いについては幹事にご確認ください」インフォメッセージを表示                                       | 小   |

### 依存関係
- Phase 3-16（支払い済みキャンセル確認ダイアログ）が前提
- 4-2（Stripe 決済＋自動返金）と連携

---

## 4-1: カレンダー D&D コピー/移動 — 設計メモ

### 概要
- `@dnd-kit/core` を導入し、カレンダー上の予定を別日へドラッグ＆ドロップ
- 管理者以上のユーザーのみ操作可能
- ドロップ時に確認ダイアログ（コピー / 移動 / キャンセルの3択）
- 繰り返しルールは対象外。日付のみ変更

### 実装ステップ

| #   | レイヤ | タスク                                                                              | 工数 |
| --- | ------ | ----------------------------------------------------------------------------------- | ---- |
| D-1 | **FE** | `@dnd-kit/core` インストール + カレンダーに DndContext / Droppable / Draggable 設定 | 中   |
| D-2 | **FE** | D&D操作時の確認ダイアログ（コピー/移動/キャンセル 3択）                             | 中   |
| D-3 | **FE** | コピー: `POST /v1/schedules` で新日付のスケジュール作成                             | 小   |
| D-4 | **BE** | 移動: `PATCH /v1/schedules/:id` で日付のみ更新（既存APIで対応可能か確認）           | 小   |
| D-5 | **FE** | 移動: 更新API呼び出し + キャッシュ無効化                                            | 小   |
| D-6 | **FE** | 管理者以上のみD&D有効化（roleチェック）                                             | 小   |
| D-7 | **FE** | D&D中のビジュアルフィードバック（ドラッグ中のプレビュー等）                         | 小   |

---

## 4-3: APIエラーハンドリング全体見直し — 設計メモ

### 課題
- FEでBEの500エラーが発生してもユーザーに何も表示されない
- mutation の onError が全く定義されておらず、失敗がサイレント
- BE の 500 レスポンスで `err.message` がそのまま漏洩（セキュリティリスク）

### 実装内容

#### BE: エラーレスポンス標準化
- `errorHandler.ts`: 本番環境（`NODE_ENV=production`）では 500 エラーの `message` をジェネリック文言に置換
- 開発環境では従来通り `err.message` を返す（デバッグ用）

#### FE: グローバルエラートースト
- `sonner` ライブラリ導入 + `Toaster` コンポーネント（shadcn/ui パターン準拠）
- `MutationCache.onError` でグローバルにエラーをキャッチし `toast.error()` で表示
- `errorMessages.ts`: BE エラーコード → 日本語メッセージのマッピングテーブル
- 401 エラーは AuthProvider 側でリダイレクト処理するためトースト対象外
- `meta.skipGlobalErrorHandler: true` で個別 mutation のスキップが可能

### 変更ファイル

| ファイル                                       | 変更内容                                  |
| ---------------------------------------------- | ----------------------------------------- |
| `backend/src/api/middleware/errorHandler.ts`   | 本番環境で 500 メッセージ隠蔽             |
| `frontend/src/shared/components/ui/sonner.tsx` | Toaster コンポーネント（新規）            |
| `frontend/src/shared/lib/errorMessages.ts`     | エラーコード→日本語メッセージ変換（新規） |
| `frontend/src/shared/lib/queryClient.ts`       | MutationCache.onError 追加                |
| `frontend/src/app/App.tsx`                     | `<Toaster />` 配置                        |

## 4-1: カレンダー D&D 実装完了 — 変更ファイル一覧

### Frontend 新規ファイル

| ファイル                                                                     | 内容                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `frontend/src/features/activity/components/dnd/DroppableCalendarDay.tsx`     | カレンダー日付セルをドロップターゲット化（useDroppable + ハイライト） |
| `frontend/src/features/activity/components/dnd/DraggableScheduleCard.tsx`    | ScheduleCardをドラッグ可能に（useDraggable + GripVerticalハンドル）   |
| `frontend/src/features/activity/components/dnd/ScheduleDndConfirmDialog.tsx` | コピー/移動/キャンセル 3択ダイアログ（shadcn Dialog）                 |
| `frontend/src/features/activity/components/dnd/ScheduleDragOverlay.tsx`      | ドラッグ中のプレビューカード                                          |
| `frontend/src/features/activity/hooks/useScheduleDnd.ts`                     | コピー(POST)/移動(PATCH) + キャッシュ無効化 + toast通知               |

### Frontend 変更ファイル

| ファイル                                                                   | 変更内容                                                                                                  |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx` | CalendarSubTabにDndContext統合、管理者以上でのみD&D有効化、DroppableCalendarDay/DraggableScheduleCard利用 |

### 依存パッケージ

- `@dnd-kit/core` v6.3.1（新規追加）
- `@dnd-kit/utilities` v3.2.2（新規追加）

---

## 4-2: 実装完了 — 変更ファイル一覧

### Backend 新規ファイル

| ファイル                                                                               | 内容                                                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `backend/src/application/participation/usecase/CreateStripePaymentIntentUseCase.ts`    | PaymentIntent 作成（Schedule→Activity→Community チェーンで stripeAccountId 取得） |
| `backend/src/application/participation/usecase/HandleStripePaymentSucceededUseCase.ts` | Webhook: `payment_intent.succeeded` → PaymentStatus を CONFIRMED に更新           |
| `backend/src/application/participation/usecase/HandleStripeRefundCompletedUseCase.ts`  | Webhook: `charge.refunded` → PaymentStatus を REFUNDED に更新                     |
| `backend/src/api/webhook/stripe/controllers/stripeWebhookController.ts`                | Stripe Webhook コントローラ（署名検証+イベントディスパッチ）                      |
| `backend/src/api/webhook/stripe/routes/stripeWebhookRoutes.ts`                         | `POST /v1/webhooks/stripe` + `express.raw()`                                      |
| `backend/src/domains/payment/domain/service/calculatePaymentAmount.ts`                 | 手数料計算ユーティリティ（PLATFORM_FEE_RATE=4%）                                  |

### Backend 変更ファイル

| ファイル                                                                                     | 変更内容                                                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `backend/prisma/schema.prisma`                                                               | `stripePaymentIntentId` on Participation, `stripeAccountId` on Community             |
| `backend/src/api/_usecaseFactory.ts`                                                         | 新規UseCase3つ+CancelParticipationにStripeServiceImpl注入                            |
| `backend/src/api/server.ts`                                                                  | `/v1/webhooks/stripe` パスで express.json() をスキップ                               |
| `backend/src/api/front/participation/controllers/participationController.ts`                 | `createStripePaymentIntent` ハンドラ追加                                             |
| `backend/src/api/front/participation/routes/participationRoutes.ts`                          | `POST /v1/schedules/:id/participations/me/stripe-payment-intent` 追加                |
| `backend/src/application/participation/usecase/CancelParticipationUseCase.ts`                | Stripe自動返金ロジック追加 + participationFee取得バグ修正（Activity→Schedule）       |
| `backend/src/domains/community/domain/model/entity/Community.ts`                             | `stripeAccountId` フィールド追加（constructor, create, reconstruct, update, getter） |
| `backend/src/domains/community/infrastructure/repository/CommunityRepositoryImpl.ts`         | `stripeAccountId` の save/toDomain 対応                                              |
| `backend/src/domains/participation/domain/model/entity/Participation.ts`                     | `stripePaymentIntentId` フィールド追加                                               |
| `backend/src/domains/participation/infrastructure/repository/ParticipationRepositoryImpl.ts` | `stripePaymentIntentId` の save/toDomain 対応                                        |
| `backend/src/domains/payment/domain/model/valueobject/PaymentStatus.ts`                      | `REFUND_PENDING`, `REFUNDED` ステータス追加                                          |
| `backend/src/integration/stripe/IStripeService.ts`                                           | `createPaymentIntent`, `refundPaymentIntent`, `constructEvent` メソッド追加          |
| `backend/src/integration/stripe/StripeServiceImpl.ts`                                        | 上記メソッドの実装                                                                   |

### Frontend 新規ファイル

| ファイル                                                                | 内容                         |
| ----------------------------------------------------------------------- | ---------------------------- |
| `frontend/src/shared/lib/stripe.ts`                                     | Stripe.js シングルトン初期化 |
| `frontend/src/features/participation/components/StripePaymentModal.tsx` | Stripe Elements 決済モーダル |

### Frontend 変更ファイル

| ファイル                                                                       | 変更内容                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `frontend/src/features/participation/components/ParticipationActionButton.tsx` | Stripe 決済フロー統合                             |
| `frontend/src/shared/types/api.ts`                                             | `CreateStripePaymentIntentResponse` 型追加        |
| `frontend/src/features/participation/api/participationApi.ts`                  | `createStripePaymentIntent` メソッド追加          |
| `frontend/src/features/participation/hooks/useParticipationQueries.ts`         | `useCreateStripePaymentIntent` mutation hook 追加 |

### ⏳ 未完了（環境設定）

- Prisma マイグレーション未実行（`prisma migrate dev` が必要）
- `VITE_STRIPE_PUBLISHABLE_KEY` 環境変数未設定
- `STRIPE_WEBHOOK_SECRET` 環境変数（AppSecretsLoader で読み込み済み）

---

## 作業ログ

- 2026-03-11: Phase 4 プランニング開始。支払い済みキャンセル→再参加フローの現状分析を実施。4-4 タスク新設。全タスクの実装ステップを整理
- 2026-03-11: 支払い方法別に分析（CASH=対応不要、STRIPE=4-2で自動返金、PayPay=履歴参照でリンク非表示）。4-2 を「Stripe決済＋自動返金」に拡張
- 2026-03-11: Stripe手数料4%方式を確定。`transfer_data.amount`でコミュニティに参加費ぴったり入金、残り(0.4%相当)をアプリ収益として受取。端数問題を完全解消
- 2026-03-11: 4-3 実装完了。BE: errorHandler 500メッセージ隠蔽。FE: sonner + MutationCache.onError でグローバルエラートースト。errorMessages.ts で全エラーコードを日本語マッピング
- 2026-03-11: 4-4 実装完了。BE: IParticipationAuditLogRepository.findLatestCancellation + GetParticipationHistoryUseCase + GET /v1/schedules/:id/participations/me/history。FE: ParticipationActionButtonでPayPay支払い済みキャンセル履歴ありの場合にPayPay選択肢非表示+インフォメッセージ。個別エラー表示を4-3のグローバルトーストに統合
- 2026-03-12: 4-2 実装完了。BE: CreateStripePaymentIntentUseCase, HandleStripePaymentSucceededUseCase, HandleStripeRefundCompletedUseCase, Webhook endpoint, CancelParticipation自動返金, Community.stripeAccountId, Participation.stripePaymentIntentId。FE: StripePaymentModal, stripe.ts, ParticipationActionButton Stripe統合。participationFee取得バグ修正（Activity→Schedule）。tsc --noEmit 両方通過
- 2026-03-12: 4-1 実装完了。@dnd-kit/core + @dnd-kit/utilities 導入。DroppableCalendarDay（カレンダー日付セルをドロップターゲット化）、DraggableScheduleCard（ドラッグハンドル付き）、ScheduleDndConfirmDialog（コピー/移動/キャンセル 3択）、ScheduleDragOverlay（ドラッグ中プレビュー）、useScheduleDnd（コピー=POST、移動=PATCH + キャッシュ無効化）。CalendarSubTabにDndContext統合、isAdminOrAboveで管理者以上のみD&D有効。BE追加実装不要（既存PATCH /v1/schedules/:idがdate更新対応済み）。tsc --noEmit 通過
- 2026-03-11: 4-5 実装完了。BE: ListActivitiesUseCase.upcomingSchedulesにid追加、CreateActivityUseCase戻り値にscheduleId追加。FE: ScheduleCard/ActivityCreatePage/ActivityListPage全ナビゲーションに`?schedule=scheduleId`付与。ActivityDetailPage: useSearchParamsでschedule取得→単一スケジュール表示（fallbackなし）。ScheduleSection日時ヘッダー削除。繰り返し予定ナビ（recurrenceRule && schedules.length>1 時のみ表示、参加費の下に配置）
- 2026-03-11: 4-6 実装完了。BE: FindActivityUseCaseにICommunityRepository注入→communityPaymentSettings（enabledPaymentMethods, paypayId, stripeAccountId）をレスポンスに追加。_usecaseFactoryにCommunityRepositoryImpl注入。FE: api.tsにActivityDetail.communityPaymentSettings型追加。ParticipationActionButton: enabledPaymentMethods propで無効な支払い方法をdisabled表示+「有効にするには管理者に問い合わせてください」テキスト。ActivityDetailPage→ScheduleSection経由でenabledPaymentMethodsをパススルー。CommunitySettingsPage: 支払い方法チェックボックスにSTRIPE（クレジットカード）追加。BE build + サーバ再起動完了、tscエラーなし
- 2026-03-12: 4-7 Paymentテーブル分離+UIクリーンアップ実装完了。FE: ActivityDetailPage参加者テーブルに「支払い方法」「支払い」列追加(isAdminOrAboveのみ)。支払いステータス: UNPAID→未済/REPORTED→確認待ち/CONFIRMED→済/REFUND_PENDING→返金待ち/REFUNDED→返金済。キャンセルボタン「参加を取り消す」→「キャンセル」。キャンセルボタン横に支払い方法表示
- 2026-03-12: 4-8 返金管理UI実装完了。BE: IPaymentRepositoryにfindRefundPendingByScheduleId/findRefundPendingByCommunityId追加。PaymentエンティティにrevertRefund()追加。MarkRefundCompletedUseCase, RevertRefundStatusUseCase, ListRefundPendingPaymentsUseCase作成。API: GET /v1/schedules/:id/payments/refund-pending, GET /v1/communities/:id/payments/refund-pending, PATCH /v1/payments/:paymentId/mark-refunded, PATCH /v1/payments/:paymentId/revert-refund。FE: RefundPendingSection(アクティビティ詳細adminのみ), RefundManagementPage(コミュニティレベル,ユーザー別/スケジュール別ビュー)。CommunityProfileHeaderに返金管理リンク追加。App.tsxに/communities/:id/refundsルート追加。BE build+FE tsc --noEmit両方通過