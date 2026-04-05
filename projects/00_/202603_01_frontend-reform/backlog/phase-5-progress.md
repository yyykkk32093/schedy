# Backlog Phase 5: 高度 Web 機能 + 外部連携 — 進捗

> **最終更新**: 2026-03-06
> **ステータス**: 🔲 未着手
> **テーマ**: 高度 Web 機能（投票・外部連携・決済高度化）+ FE Capacitor クリーンアップ
> **前提条件**: Backlog Phase 3（プッシュ通知基盤）+ Backlog Phase 4（分析機能）

---

## ⚠️ Capacitor 撤廃・ネイティブ案件分離（2026-03-06 決定）

**方針変更**: Capacitor（ハイブリッド）を見送り、以下の方針に変更。

- **Web + LINE Mini App（LIFF）** で公開 → Capacitor 不要
- **iOS**: Swift/SwiftUI でフルネイティブ構築（App Store 配布）
- **Android**: Kotlin でフルネイティブ構築（後回し）

**移管先:**
- UBL-23（Capacitor 初期化）→ **削除**（Capacitor 自体が不要）
- UBL-24（ネイティブ Stripe）→ `projects/ios-native/` に移管
- UBL-25（RevenueCat）→ `projects/ios-native/` に移管
- UBL-26（ネイティブプッシュ通知）→ `projects/ios-native/` に移管
- UBL-27（ストア申請）→ `projects/ios-native/` に移管
- サブタスク 23-1〜23-3（`isNativePlatform()` 分岐系）→ **削除**（FE にネイティブ分岐不要）

---

## タスク一覧

### FE Capacitor クリーンアップ

| UBL    | タスク                          | レイヤ | ステータス | 備考                                                                                                          |
| ------ | ------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| UBL-36 | FE Capacitor コード・依存の除去 | FE     | 🔲 未着手   | `capacitor.config.ts` 削除、`@capacitor/core` / `@capacitor/cli` アンインストール、`adapters/capacitor/` 削除 |

**サブタスク:**

| #    | サブタスク                                            | レイヤ | ステータス | 備考                                                                             |
| ---- | ----------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------- |
| 36-1 | `frontend/capacitor.config.ts` 削除                   | FE     | 🔲 未着手   | Capacitor 設定ファイル削除                                                       |
| 36-2 | `@capacitor/core` / `@capacitor/cli` アンインストール | FE     | 🔲 未着手   | `pnpm remove @capacitor/core @capacitor/cli`                                     |
| 36-3 | `adapters/capacitor/` ディレクトリ削除                | FE     | 🔲 未着手   | `CapAuthTokenAdapter` / `CapStorageAdapter` / barrel export を削除               |
| 36-4 | `isNativePlatform()` 分岐の簡素化                     | FE     | 🔲 未着手   | Capacitor 分岐を削除。将来は `liff.isInClient()` 分岐に変更（LIFF 案件で対応）   |
| 36-5 | コメント内の Capacitor 言及を修正                     | FE/BE  | 🔲 未着手   | 「Capacitor/LIFF 向け」→「LIFF/ネイティブアプリ向け」等に修正（BE コメント含む） |

### 決済高度化

| UBL    | タスク                             | レイヤ | ステータス | 備考                                                                                                                |
| ------ | ---------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| UBL-28 | off_session 課金失敗時プッシュ通知 | BE     | 🔲 未着手   | 将来の自動課金導入時に必要。SetupIntent + off_session で `requires_action` / `card_declined` 時のプッシュ通知フロー |

### 外部連携

| UBL    | タスク                          | レイヤ | ステータス | 備考               |
| ------ | ------------------------------- | ------ | ---------- | ------------------ |
| UBL-29 | Slack / LINE / Discord 通知連携 | BE/FE  | 🔲 未着手   | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク           | レイヤ | ステータス | 備考                                   |
| ---- | -------------------- | ------ | ---------- | -------------------------------------- |
| 29-1 | 外部サービス通知連携 | BE     | 🔲 未着手   | 既存 Outbox パターン活用。Webhook 送信 |
| 29-2 | Webhook 設定 UI      | FE     | 🔲 未着手   | SUBSCRIBER/LIFETIME のみ               |

### 投票/アンケート機能（新規）

| UBL    | タスク                                          | レイヤ   | ステータス | 備考               |
| ------ | ----------------------------------------------- | -------- | ---------- | ------------------ |
| UBL-34 | 投票/アンケート機能（Poll ドメインモデル + UI） | DB/BE/FE | 🔲 未着手   | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク              | レイヤ | ステータス | 備考                                                   |
| ---- | ----------------------- | ------ | ---------- | ------------------------------------------------------ |
| 34-1 | Poll ドメインモデル設計 | DB/BE  | 🔲 未着手   | Poll / PollOption / PollVote テーブル + エンティティ   |
| 34-2 | Poll CRUD API           | BE     | 🔲 未着手   | 投票作成・投票実行・結果取得。管理者以上が作成         |
| 34-3 | 投票作成 UI             | FE     | 🔲 未着手   | アナウンス作成画面（UBL-35）に「投票を追加」オプション |
| 34-4 | 投票結果表示 UI         | FE     | 🔲 未着手   | 棒グラフ / 円グラフでリアルタイム結果表示              |

**Poll ドメインモデル:**

```
Poll
  ├── id: String @id @default(uuid())
  ├── announcementId: String?（アナウンスに紐づく場合）
  ├── communityId: String
  ├── question: String
  ├── isMultipleChoice: Boolean @default(false)
  ├── deadline: DateTime?
  ├── createdBy: String（userId）
  ├── createdAt: DateTime
  └── options: PollOption[]

PollOption
  ├── id: String @id @default(uuid())
  ├── pollId: String
  ├── text: String
  ├── sortOrder: Int
  └── votes: PollVote[]

PollVote
  ├── id: String @id @default(uuid())
  ├── pollOptionId: String
  ├── userId: String
  ├── votedAt: DateTime
  └── @@unique([pollOptionId, userId])（単一選択時の重複防止）
```

---

## 実装順序（推奨）

1. **UBL-36**（FE Capacitor クリーンアップ）— 不要コードの除去
2. **UBL-34**（投票/アンケート）— 独立して実装可能
3. **UBL-29**（外部連携）— 独立して実装可能
4. **UBL-28**（off_session 課金）— 自動課金導入判断後

---

## 依存関係

```
UBL-36 FE Capacitorクリーンアップ ← 即実行可能（依存なし）

UBL-28 off_session課金 ← 自動課金導入判断
UBL-29 外部連携 ← Outboxパターン（既存）
UBL-34 投票/アンケート ← UBL-35 アナウンス作成画面（Backlog Phase 2）
```

---

## 技術メモ

- **Outbox パターン活用**: Webhook 送信も Outbox 経由で信頼性担保（`backend/src/job/outbox/` 参照）
- **IStripeService / StripeServiceImpl の保持**: Backlog Phase 1 で既存 Stripe Connect スキャフォールド（`SchedulePayment` / `StripeConnectAccount` テーブル + UseCase 8本 + API + Repository）を削除したが、`backend/src/integration/stripe/IStripeService.ts` と `StripeServiceImpl.ts` は iOS ネイティブアプリ（`projects/ios-native/`）の Stripe PaymentSheet 共通基盤として保持。BE の PaymentIntent 作成・Webhook 検証・返金処理はネイティブ/Web 共通で再利用する。（2026-03-05 決定）
- **Poll ドメインモデル**: アナウンスに紐づく投票（`announcementId`）とコミュニティ直接の投票（`communityId` のみ）の両方をサポート。`PollVote` の `@@unique([pollOptionId, userId])` で単一選択時の重複を防止
- **Capacitor 撤廃**: 2026-03-06 決定。Web + LIFF で公開し、ストア配布は Swift/Kotlin フルネイティブで行う方針。旧 UBL-23〜27 は `projects/ios-native/` に移管済み

---

## 作業ログ

- 2026-03-04: バックログ統合時に Backlog Phase 5 として編成（旧 BE Capacitor + off_session + 外部連携 + AI連携）
- 2026-03-05: UBL-24 に Stripe FE 動線クローズ方針を追記。Web 版では enabledPaymentMethods で Stripe を初期無効化し、ネイティブ対応時に開放する方針
- 2026-03-06: UBL-34（投票/アンケート機能）を新規追加。Poll / PollOption / PollVote のドメインモデル設計を策定
- 2026-03-06: **Capacitor 撤廃決定**。UBL-23〜27 + サブタスク 23-1〜23-3 を削除/移管。ネイティブアプリは `projects/ios-native/`・`projects/android-native/` で独立案件管理。Phase 5 テーマを「高度 Web 機能 + 外部連携」に変更。UBL-36（FE Capacitor クリーンアップ）を新設
- 2026-03-06: UBL-30（AI 連携）を Ideabox（I-4）に移管。要件未定のため Phase 5 から除外
