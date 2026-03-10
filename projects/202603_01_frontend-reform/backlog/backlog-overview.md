# 📋 統合バックログ — 全体一覧

> **最終更新**: 2026-03-06
> **ステータス**: 🚧 作業中
> **概要**: フロントエンド改革バックログ（BL-1〜14）とバックエンド Phase 後回し項目を統合し、Backlog Phase 1〜5 に再編成

---

## 統合方針

- **フロントエンド** `phase_backlog_frontend_progress.md`（14件）と**バックエンド** `phase-backlog-backend-progress.md`（12カテゴリ/35サブタスク）を一元管理
- 重複・オーバーラップを排除し、統合IDを付与（`UBL-{連番}`）
- 作業レイヤタグ: `FE`（フロント） / `BE`（バックエンド） / `DB`（データベース） / `Infra`（インフラ）
- ステータス表記: `🔲 未着手` / `🚧 作業中` / `✅ 完了`

---

## 重複排除・統合の記録

| 統合内容                 | 統合元                                                                            | 統合方針                                                                    |
| ------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **繰り返しスケジュール** | FE: BL-10（Repeat BE対応）+ BE: 定例Schedule自動生成（RecurrenceRule + cron）     | 1つの UBL に統合。RecurrenceRule + cron + Schedule自動生成 + フロントUI連携 |
| **プッシュ通知基盤**     | BE: Phase 3 後回し（FCM/APNs）+ BE: Capacitor（プッシュ通知）+ BE: 一括リマインド | プッシュ通知基盤を1項目化。催促通知・リマインドは依存サブタスクとして別UBL  |
| **統計・分析機能**       | FE: BL-8（統計画面UI）+ BE: 参加率レポート / 欠席分析 / 参加者推移                | 同一Phase（Backlog Phase 4）に配置し、BE API + フロントUIを同時実装         |
| **招待画面**             | 新規要件（招待画面）→ 既存 UBL-11（メンバー招待機能）                             | UBL-11 のサブタスクとして吸収。LINE共有 + 招待ID発行                        |
| **コミュニティ設定詳細** | 新規要件（設定一覧画面）→ 既存 UBL-10（コミュニティ設定画面）                     | UBL-10 のサブタスクを大幅拡張                                               |

---

## 📝 設計決定事項（スレッド議論の結果）

### 支払い機能設計（2026-03-05 決定）

**方針**: 決済手段をプラグイン化（Strategy パターン）し、将来の追加・切替を容易にする

| 項目               | 決定内容                                                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **決済手段**       | 現金 / PayPay（個人間送金・手数料0） / Stripe（クレジット・3.6%）                                                                                                                                  |
| **UI**             | 有料アクティビティは SplitButton（参加ボタン + ドロップダウンで支払い方法選択）。無料は通常ボタン                                                                                                  |
| **PayPay 方式**    | 管理者が PayPay ID を Community 設定で1回登録。ユーザーは ID + 金額をコピーして PayPay アプリ内で手動送金                                                                                          |
| **PayPay リンク**  | 不採用（1回限り・1人限り・手動生成のため集金用途に非実用的）                                                                                                                                       |
| **PayPay API**     | 不採用（加盟店契約 + 手数料3.6%が発生するため）                                                                                                                                                    |
| **完了検知**       | PayPay/現金: ユーザー手動報告 + 管理者承認。Stripe: Webhook 自動確認                                                                                                                               |
| **ステータス遷移** | `UNPAID → REPORTED → CONFIRMED / REJECTED`（現金は null or 管理者入力）                                                                                                                            |
| **Stripe 動線**    | BE コードは残すが、FE の動線は `enabledPaymentMethods` 配列で制御（初期は PAYPAY + CASH のみ有効）                                                                                                 |
| **DB 設計**        | Participation に支払いカラム埋め込み（別テーブルにしない。1参加=1支払い）                                                                                                                          |
| **Stripe 手数料**  | ユーザー負担（3.6%上乗せ）。決済前にアラートダイアログで内訳表示（参加費 + 手数料 = 合計）+ 「PayPayに変更」導線を提供。運営者手取り = 参加費を保証。逆算式: `totalCharge = baseFee / (1 - 0.036)` |
| **振込**           | 当面システム対応なし                                                                                                                                                                               |

**イレギュラーパターン対策:**

| パターン                                 | 対策                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| PayPay 送金後アプリに戻らない / 報告忘れ | localStorage で「PayPay 開いたが未報告」状態を保持 → リマインドバナー表示 |
| 虚偽報告                                 | REPORTED → CONFIRMED の管理者承認フロー必須                               |
| 二重タップ                               | API 側で (userId, scheduleId) の複合ユニーク制約で冪等性保証              |
| 金額間違い                               | 報告時にユーザー自己申告額を送信 → 管理者が期待額と照合                   |
| ネットワーク断                           | フロントでリトライ + 楽観的 UI                                            |
| 現金の追跡                               | デフォルトは `—`（追跡なし）。管理者が任意で「受領済み」マーク可能        |

### Capacitor 撤廃・ネイティブ分離の決定（2026-03-06 決定）

| 項目                    | 決定内容                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Capacitor 撤廃**      | Web + LINE Mini App（LIFF）で公開するため Capacitor は不要。ハイブリッドアプリは見送り                                       |
| **iOS ネイティブ**      | Swift/SwiftUI でフルネイティブ構築 → App Store 配布。独立案件（`projects/ios-native/`）                                      |
| **Android ネイティブ**  | Kotlin でフルネイティブ構築。iOS 後に着手。独立案件（`projects/android-native/`）                                            |
| **LIFF 統合**           | 最優先。独立案件（`projects/liff-integration/`）。Web 版完成後に着手                                                         |
| **移管タスク**          | UBL-23（削除）、UBL-24〜27 → `projects/ios-native/` に移管                                                                   |
| **FE クリーンアップ**   | UBL-36 として Phase 5 に追加（`capacitor.config.ts` 削除、依存除去、`adapters/capacitor/` 削除）                             |
| **IStripeService 保持** | BE の `IStripeService` / `StripeServiceImpl` は iOS ネイティブアプリの共通決済基盤として保持（`backlog-overview.md` で管理） |

### 新規要件統合の設計決定（2026-03-06 決定）

| 項目                 | 決定内容                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **通知一覧画面**     | Phase 3 に配置。UBL-14（プッシュ通知基盤）と同時実装                                                                           |
| **分析画面**         | Phase 4 のまま（PREMIUM grade 制限）                                                                                           |
| **投票/アンケート**  | Phase 5 に配置（新規ドメインモデル: Poll / PollOption / PollVote）                                                             |
| **招待の LINE 連携** | `navigator.share` / LINE URL Scheme による FE 共有（LINE Messaging API は不採用）。共有方法を抽象化し後から切り替え可能        |
| **設定変更履歴**     | 専用テーブル `CommunityAuditLog` で管理（Outbox とは責務分離）                                                                 |
| **メンバー一覧**     | 表示のみ。管理者向け操作はコミュニティ設定画面に集約                                                                           |
| **通知種別**         | コミュニティ系（アナウンス・招待受諾・参加リクエスト承認）+ アクティビティ系（開催取り消し・リマインド・キャンセル繰り上げ等） |

---

## 全タスク一覧（統合ID順）

| UBL    | タスク                                                                | レイヤ         | Backlog Phase | 旧ID                                 | ステータス |
| ------ | --------------------------------------------------------------------- | -------------- | ------------- | ------------------------------------ | ---------- |
| UBL-1  | いいね機能（Announcement）                                            | DB/BE/FE       | 1             | FE: BL-1                             | ✅ 完了     |
| UBL-2  | コメント機能（Announcement）                                          | DB/BE/FE       | 1             | FE: BL-2                             | ✅ 完了     |
| UBL-3  | 画像添付機能（Announcement）                                          | DB/BE/FE/Infra | 1             | FE: BL-3                             | ✅ 完了     |
| UBL-4  | Home画面 検索バー                                                     | BE/FE          | 1             | FE: BL-4                             | ✅ 完了     |
| UBL-5  | ヘッダー プロフィールアバター追加                                     | FE             | 1             | FE: BL-5                             | ✅ 完了     |
| UBL-6  | アルバム機能（API + DB + フロントUI連携）                             | DB/BE/FE/Infra | 1             | FE: BL-6                             | ✅ 完了     |
| UBL-7  | 参加 + 支払い SplitButton（参加機能連携）                             | DB/BE/FE       | 1             | FE: BL-11                            | ✅ 完了     |
| UBL-8  | 支払い機能（PayPay/Stripe/現金 Strategy パターン）                    | DB/BE/FE       | 1             | FE: BL-12                            | ✅ 完了     |
| UBL-9  | 繰り返しスケジュール（RecurrenceRule + cron + 自動生成 + フロントUI） | DB/BE/FE       | 2             | FE: BL-10 + BE: 定例Schedule自動生成 | 🔲 未着手   |
| UBL-10 | コミュニティ設定画面（権限・移譲・履歴含む）                          | DB/BE/FE       | 2             | FE: BL-7 + 新規要件                  | 🔲 未着手   |
| UBL-11 | メンバー招待機能（LINE共有 + 招待ID + フロントUI）                    | DB/BE/FE       | 2             | FE: BL-9 + 新規要件                  | 🔲 未着手   |
| UBL-12 | WebSocket リアルタイム対応（サーバー + クライアント）                 | BE/FE/Infra    | 3             | FE: BL-13                            | ✅ 完了     |
| UBL-13 | メッセージ検索（API + フロントUI）                                    | BE/FE          | 3             | FE: BL-14                            | ✅ 完了     |
| UBL-14 | プッシュ通知基盤（FCM / APNs）                                        | BE/Infra       | 3             | BE: Phase 3 後回し + BE: Capacitor   | ✅ 完了     |
| UBL-15 | 支払い催促通知（自動リマインド）                                      | BE             | 3             | BE: Phase 3 後回し                   | ✅ 完了     |
| UBL-16 | 既存リマインダーのプッシュ通知対応（PREMIUM限定）                     | BE/FE          | 3             | BE: Phase 4 移動                     | ✅ 完了     |
| UBL-17 | コミュニティ統計画面 + 参加率レポートAPI                              | DB/BE/FE       | 4             | FE: BL-8 + BE: 参加率レポート        | ✅ 完了     |
| UBL-18 | 欠席 / 当日キャンセル把握 + 管理者向けアラート                        | DB/BE/FE       | 4             | BE: 欠席/当日キャンセル              | ✅ 完了     |
| UBL-19 | 参加者増減推移（時系列集計 + グラフ）                                 | DB/BE/FE       | 4             | BE: 参加者増減推移                   | ✅ 完了     |
| UBL-20 | 参加状況 CSV 出力                                                     | BE/FE          | 4             | BE: 参加状況CSV出力                  | ✅ 完了     |
| UBL-21 | 会計情報出力（CSV / PDF）                                             | BE/FE          | 4             | BE: 会計情報出力                     | ✅ 完了     |
| UBL-22 | 外部カレンダーエクスポート（iCal + Google Calendar）                  | BE/FE          | 4             | BE: 外部カレンダーエクスポート       | ✅ 完了     |
| UBL-23 | ~~Capacitor iOS/Android プロジェクト初期化~~                          | ~~Infra/FE~~   | ~~5~~         | ~~BE: Capacitor~~                    | ❌ 削除     |
| UBL-24 | ~~ネイティブ Stripe（PaymentSheet対応）~~                             | ~~FE/Infra~~   | ~~5~~         | → `projects/ios-native/` に移管      | ➡️ 移管     |
| UBL-25 | ~~RevenueCat 導入（IAP / サブスクリプション）~~                       | ~~FE/Infra~~   | ~~5~~         | → `projects/ios-native/` に移管      | ➡️ 移管     |
| UBL-26 | ~~ネイティブプッシュ通知~~                                            | ~~FE/Infra~~   | ~~5~~         | → `projects/ios-native/` に移管      | ➡️ 移管     |
| UBL-27 | ~~App Store / Google Play 申請準備~~                                  | ~~Infra~~      | ~~5~~         | → `projects/ios-native/` に移管      | ➡️ 移管     |
| UBL-28 | off_session 課金失敗時プッシュ通知                                    | BE             | 5             | BE: Phase 3 後回し                   | ⏸️ スキップ |
| UBL-29 | LINE 通知連携（Webhook）※ Slack/Discord は Ideabox（I-5, I-6）に移管  | BE/FE          | 5             | BE: Phase 4 移動                     | ✅ 完了     |
| UBL-30 | ~~AI 連携~~                                                           | ~~BE/FE~~      | ~~5~~         | → Ideabox（I-4）に移管               | 💡 Ideabox  |
| UBL-31 | 通知一覧画面（アプリ内通知UI + 種別フィルタ + API）                   | DB/BE/FE       | 3             | 新規要件                             | ✅ 完了     |
| UBL-32 | マイページ（プロフィール設定 + 招待受諾）                             | BE/FE          | 2             | 新規要件                             | 🔲 未着手   |
| UBL-33 | メンバー一覧画面（表示のみ）                                          | FE             | 2             | 新規要件                             | 🔲 未着手   |
| UBL-34 | 投票/アンケート機能（Poll ドメインモデル + UI）                       | DB/BE/FE       | 5             | 新規要件                             | ✅ 完了     |
| UBL-35 | アナウンスメント作成画面（FE）                                        | FE             | 2             | 新規要件                             | 🔲 未着手   |
| UBL-36 | FE Capacitor コード・依存の除去                                       | FE             | 5             | Capacitor 撤廃に伴うクリーンアップ   | ✅ 完了     |

---

## Backlog Phase 構成

| Backlog Phase       | テーマ                                         | タスク数 | 前提条件                   |
| ------------------- | ---------------------------------------------- | -------- | -------------------------- |
| **Backlog Phase 1** | コア機能補完                                   | 8        | なし（既存インフラで完結） |
| **Backlog Phase 2** | 繰り返し + コミュニティ管理 + 基本画面         | 6        | FeatureGate（PREMIUM制限） |
| **Backlog Phase 3** | リアルタイム通信 + プッシュ通知基盤 + 通知一覧 | 6        | Backlog Phase 1 完了推奨   |
| **Backlog Phase 4** | 分析・レポート・データ出力                     | 6        | FeatureGate + 決済データ   |
| **Backlog Phase 5** | 高度 Web 機能 + 外部連携                       | 4        | Backlog Phase 3〜4 完了    |

---

## 依存関係

```
Backlog Phase 1（コア機能補完）✅ 完了
  └── 独立して実装可能（既存インフラで完結）

Backlog Phase 2（繰り返し + コミュニティ管理 + 基本画面）✅ 完了
  ├── FeatureGate（PREMIUM制限）が前提（UBL-9）
  ├── Backlog Phase 1 の S3 基盤を共有（UBL-6 アルバム）
  ├── UBL-32 マイページ → UBL-11 招待受諾フロー
  ├── UBL-33 メンバー一覧 ← ListMembersUseCase（既存BE）
  └── UBL-35 アナウンス作成画面 ← CreateAnnouncementUseCase（既存BE）

Backlog Phase 3（リアルタイム + プッシュ通知 + 通知一覧）
  ├── UBL-14 プッシュ通知基盤 → UBL-15 支払い催促通知
  ├── UBL-14 プッシュ通知基盤 → UBL-16 一括リマインド
  ├── UBL-14 プッシュ通知基盤 → UBL-31 通知一覧画面
  └── UBL-12 WebSocket → チャットリアルタイム化

Backlog Phase 4（分析・レポート）
  ├── FeatureGate → レポート制限
  ├── 決済データ → UBL-21 会計情報出力
  └── UBL-14 プッシュ通知 → UBL-18 管理者向けアラート

Backlog Phase 5（高度 Web 機能 + 外部連携）
  ├── UBL-36 FE Capacitorクリーンアップ ← 即実行可能
  ├── UBL-34 投票/アンケート ← 新規ドメインモデル（Poll）
  └── UBL-29 外部連携 ← Outboxパターン（既存）

※ 旧 UBL-23〜27（Capacitor/ネイティブ系）は独立案件に移管:
  → projects/liff-integration/（LIFF統合・最優先）
  → projects/ios-native/（Swift iOS・2番目）
  → projects/android-native/（Kotlin Android・後回し）
```

---

## 進捗管理ファイル

| Backlog Phase   | ファイル                                                             |
| --------------- | -------------------------------------------------------------------- |
| 全体一覧        | `projects/frontend-reform/backlog/backlog-overview.md`（本ファイル） |
| Backlog Phase 1 | `projects/frontend-reform/backlog/phase-1-progress.md`               |
| Backlog Phase 2 | `projects/frontend-reform/backlog/phase-2-progress.md`               |
| Backlog Phase 3 | `projects/frontend-reform/backlog/phase-3-progress.md`               |
| Backlog Phase 4 | `projects/frontend-reform/backlog/phase-4-progress.md`               |
| Backlog Phase 5 | `projects/frontend-reform/backlog/phase-5-progress.md`               |

---

## 旧ファイルとの対応

| 旧ファイル                                                           | 状態                                     |
| -------------------------------------------------------------------- | ---------------------------------------- |
| `projects/frontend-reform/phase_backlog_frontend_progress.md`        | → 本ファイルに統合済み                   |
| `projects/frontend-reform/archive/phase-backlog-backend-progress.md` | → 本ファイルに統合済み（archive に移動） |

---

## 作業ログ

- 2026-03-04: フロントエンドバックログ（BL-1〜14）とバックエンドバックログ（12カテゴリ/35サブタスク）を統合。重複3件を排除し、UBL-1〜30 に再編成。Backlog Phase 1〜5 に分解
- 2026-03-05: 支払い機能の設計を決定。PayPay 個人間送金（手数料0）+ Stripe + 現金の3方式を Strategy パターンで抽象化。UBL-7/8 の内容を大幅更新- 2026-03-05: Backlog Phase 1 着手。既存 Stripe Connect スキャフォールド削除（SchedulePayment/StripeConnectAccount テーブル + UseCase 8本 + API + Repository + FE payment/ 削除）。UBL-5（ヘッダーアバター）完了
- 2026-03-06: **Backlog Phase 1 全タスク完了**。UBL-1〜8 一括実装（DBマイグレーション + BE ドメイン/アプリ/API + FE 型/hooks/コンポーネント）。BE tsc / FE tsc ともにゼロエラー
- 2026-03-06: 新規要件統合（UBL-31〜35 追加）。通知一覧→Ph3、マイページ/メンバー一覧/アナウンス作成画面→Ph2、投票機能→Ph5。UBL-10/11 サブタスク拡張。設計決定事項に新規要件の方針を追記
- 2026-03-06: **Capacitor 撤廃・案件分離決定**。UBL-23 削除、UBL-24〜27 を `projects/ios-native/` に移管。UBL-36（FE Capacitor クリーンアップ）を新設。Phase 5 テーマを「高度 Web 機能 + 外部連携」に変更（10→5タスク）。案件管理ディレクトリを `projects/` に再構成（`frontend-reform/` 移動 + `liff-integration/` `ios-native/` `android-native/` 新設）
- 2026-03-06: **Backlog Phase 4 全タスク実装完了**（UBL-17〜22）。BE UseCase 6本 + API 6エンドポイント + FE AnalyticsTab（recharts）+ AddToCalendarButton + E2E テスト。UBL-18 のプッシュ通知アラートのみ UBL-14 未実装のため後回し
- 2026-03-06: **Backlog Phase 3 残タスク解消**。UBL-14-3 → ❌ ドロップ（Ideabox I-2）。UBL-16 → ✅ 完了（Worker プッシュ通知対応 + `reminderEnabled` 設定）。UBL-18-3 → ✅ 完了（当日キャンセル即時アラート + `cancellationAlertEnabled` 設定）。Community モデルに通知設定カラム追加 + FCM バッチ分割対応。Ph3/Ph4 の全 UBL ステータスを反映。Ideabox（`projects/202699_99_ideabox/`）新設
- 2026-03-06: UBL-30（AI 連携）を Ideabox（I-4）に移管。要件未定のため Phase 5 から除外（5→4タスク）