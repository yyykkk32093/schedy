# Backlog Phase 3: リアルタイム通信 + プッシュ通知基盤 + 通知一覧 — 進捗

> **最終更新**: 2026-03-06
> **ステータス**: ✅ 実装完了（tsc ビルドチェック通過済み）
> **テーマ**: WebSocket によるリアルタイム通信基盤 + FCM/APNs プッシュ通知基盤 + アプリ内通知一覧 + 通知系機能
> **前提条件**: Backlog Phase 1 完了推奨

---

## タスク一覧

### リアルタイム通信

| UBL    | タスク                     | レイヤ      | ステータス | 備考               |
| ------ | -------------------------- | ----------- | ---------- | ------------------ |
| UBL-12 | WebSocket リアルタイム対応 | BE/FE/Infra | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク                 | レイヤ   | ステータス | 備考                                                                              |
| ---- | -------------------------- | -------- | ---------- | --------------------------------------------------------------------------------- |
| 12-1 | Socket.io サーバー実装     | BE/Infra | ✅ 完了     | IRealtimeEmitter + NotificationService + RealtimeEmitterBootstrap                 |
| 12-2 | Socket.io クライアント実装 | FE       | ✅ 完了     | SocketProvider + useSocketChat + useSocketNotification + ポーリングフォールバック |
| 12-3 | チャットリアルタイム化     | BE/FE    | ✅ 完了     | message:new キャッシュ更新 + typing + refetchInterval条件付き化                   |

### メッセージ検索

| UBL    | タスク                             | レイヤ | ステータス | 備考                                                |
| ------ | ---------------------------------- | ------ | ---------- | --------------------------------------------------- |
| UBL-13 | メッセージ検索（API + フロントUI） | BE/FE  | ✅ 完了     | ILIKE検索API + ChannelSearchPanel（ハイライト付き） |

### プッシュ通知基盤（統合タスク）

> 旧 BE「Phase 3 後回し: プッシュ通知基盤（FCM/APNs）」+ 旧 BE「Capacitor: プッシュ通知」を統合

| UBL    | タスク                         | レイヤ   | ステータス | 備考               |
| ------ | ------------------------------ | -------- | ---------- | ------------------ |
| UBL-14 | プッシュ通知基盤（FCM / APNs） | BE/Infra | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク                         | レイヤ   | ステータス | 備考                                                               |
| ---- | ---------------------------------- | -------- | ---------- | ------------------------------------------------------------------ |
| 14-1 | デバイストークン管理（DB + API）   | DB/BE    | ✅ 完了     | DeviceToken テーブル + POST/DELETE API                             |
| 14-2 | FCM / APNs 通知配信サービス        | BE/Infra | ✅ 完了     | PushNotificationIntegrationHandler + firebase-admin                |
| 14-3 | 通知テンプレート管理               | BE       | ❌ ドロップ | Ideabox I-2 へ移動。ハードコード文言で充分                         |
| 14-4 | 既存 Notification テーブルとの統合 | BE       | ✅ 完了     | NotificationService → OutboxEvent(notification.push) → FCM Handler |

### 通知一覧画面（新規）

| UBL    | タスク                                              | レイヤ   | ステータス | 備考               |
| ------ | --------------------------------------------------- | -------- | ---------- | ------------------ |
| UBL-31 | 通知一覧画面（アプリ内通知UI + 種別フィルタ + API） | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク                       | レイヤ | ステータス | 備考                                                                                     |
| ---- | -------------------------------- | ------ | ---------- | ---------------------------------------------------------------------------------------- |
| 31-1 | 通知種別の拡張                   | DB/BE  | ✅ 完了     | CATEGORY_TYPE_MAP でカテゴリ分類（community/activity/chat）                              |
| 31-2 | 通知一覧 API                     | BE     | ✅ 完了     | category クエリパラメータ対応 + unreadCount レスポンス統一                               |
| 31-3 | 通知一覧 UI                      | FE     | ✅ 完了     | タブUI（すべて/コミュニティ/アクティビティ/チャット）+ 未読バッジ + NotificationTypeChip |
| 31-4 | 通知生成ロジック（イベント連携） | BE     | ✅ 完了     | CancelParticipation + CancelSchedule + CreateAnnouncement + AcceptInvite 統合済み        |

**通知種別設計:**

| カテゴリ             | 通知種別                | トリガー                                    |
| -------------------- | ----------------------- | ------------------------------------------- |
| **コミュニティ系**   | `ANNOUNCEMENT`          | アナウンス投稿時                            |
|                      | `INVITE_ACCEPTED`       | 招待が受諾された時（招待者 → 管理者へ通知） |
|                      | `JOIN_REQUEST_APPROVED` | 参加リクエストが承認された時                |
| **アクティビティ系** | `SCHEDULE_CANCELLED`    | スケジュール開催が取り消された時            |
|                      | `SCHEDULE_REMINDER`     | スケジュール開始前のリマインド              |
|                      | `WAITLIST_PROMOTED`     | キャンセル繰り上げで参加確定した時（既存）  |
|                      | `PAYMENT_REMINDER`      | 支払い催促通知（UBL-15 と連携）             |

### 通知系機能（UBL-14 が前提）

| UBL    | タスク                                            | レイヤ | ステータス | 備考                                                                     |
| ------ | ------------------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------ |
| UBL-15 | 支払い催促通知（自動リマインド）                  | BE     | ✅ 完了     | PaymentReminderWorker（3日先/重複防止/PAYMENT_REMINDER通知）             |
| UBL-16 | 既存リマインダーのプッシュ通知対応（PREMIUM限定） | BE/FE  | ✅ 完了     | Worker を Outbox 経由 FCM 対応。community.reminderEnabled で ON/OFF 制御 |

---

## 実装順序（推奨）

1. **UBL-12**（WebSocket 基盤）— インフラ変更を伴うため最初に着手
2. **UBL-13**（メッセージ検索）— WebSocket と並行して API 開発可能
3. **UBL-14**（プッシュ通知基盤）— FCM/APNs セットアップ + デバイストークン管理
4. **UBL-31**（通知一覧画面）— UBL-14 の通知テンプレート・Notification テーブル統合と同時実装
5. **UBL-15 → UBL-16**（通知系機能）— プッシュ通知基盤 + 通知一覧完了後に実装

---

## 依存関係

```
UBL-12 WebSocket基盤
  └── チャットリアルタイム化（REST ポーリング置換）

UBL-14 プッシュ通知基盤
  ├── UBL-31 通知一覧画面（通知種別拡張 + 既存テーブル統合が共通基盤）
  ├── UBL-15 支払い催促通知
  ├── UBL-16 一括リマインド
  ├── Backlog Phase 4: UBL-18 管理者向けアラート
  └── Backlog Phase 5: UBL-26 ネイティブプッシュ通知
```

---

## 技術メモ

- **Socket.io**: `backend/src/api/server.ts` で Express + Socket.io を共存。名前空間（`/chat`）で分離
- **FCM**: Firebase Admin SDK（`firebase-admin`）を `backend/` に導入。サービスアカウントキーは `backend/env/` で管理
- **デバイストークン**: `DeviceToken` テーブルを Prisma schema に追加（userId + platform + token）
- **既存 Outbox パターン**: プッシュ通知送信も Outbox 経由で信頼性を担保（`backend/src/job/outbox/` 参照）
- **通知種別**: 既存 `NotificationType` enum（`MENTION | DM | ANNOUNCEMENT | WAITLIST_PROMOTED`）を拡張。コミュニティ系・アクティビティ系のカテゴリ分類をフロントで実装
- **通知一覧 UI**: ヘッダーのベルマークに未読数バッジ表示。タップで通知一覧画面へ遷移。種別タブ（全て / コミュニティ / アクティビティ）で切替

---

## 作業ログ

- 2026-03-04: バックログ統合時に Backlog Phase 3 として編成（旧 FE BL-13, BL-14 + 旧 BE プッシュ通知基盤・催促通知・リマインド）
- 2026-03-05: UBL-15 の備考を PayPay 手動報告フロー（paymentStatus = UNPAID 対象）に合わせて更新
- 2026-03-06: UBL-31（通知一覧画面）を新規追加。通知種別設計（コミュニティ系 + アクティビティ系）を策定
- 2026-03-07: **全タスク実装完了**。tsc BE+FE ビルドチェック通過。以下を実装:
  - BE: IRealtimeEmitter + NotificationService + RealtimeEmitterBootstrap + PushNotificationIntegrationHandler + DeviceToken API + PaymentReminderWorker
  - FE: SocketProvider + useSocketChat + useSocketNotification + ChannelSearchPanel + NotificationListPage タブUI + 未読バッジ
  - UseCase統合: CancelParticipation（WAITLIST_PROMOTED）/ CancelSchedule（SCHEDULE_CANCELLED）
- 2026-03-07: **残タスク消化**:
  - CreateAnnouncementUseCase → ANNOUNCEMENT 通知統合（全メンバーに通知）
  - AcceptInviteUseCase → INVITE_ACCEPTED 通知統合（OWNER/ADMINに通知）
  - ScheduleReminderWorker 新規作成（明日のスケジュール → SCHEDULE_REMINDER）
  - FCM credentials → AppSecretsLoader 統合（FcmConfig 型追加、getFcm() アクセサ）
  - Prisma マイグレーション実行（20260306091004_add_device_token）
- 2026-03-06: **Ph3 残タスク解消**:
  - UBL-14-3（通知テンプレート管理）→ ❌ ドロップ（Ideabox I-2 へ移動）
  - UBL-16: ScheduleReminderWorker / PaymentReminderWorker を Outbox 経由 FCM プッシュ対応に改修。PREMIUM コミュニティのみ FCM 送信、FREE は従来通り DB 通知のみ。`community.reminderEnabled` で ON/OFF 制御
  - UBL-18-3: CancelParticipationUseCase に当日キャンセル即時アラート追加。OWNER/ADMIN にプッシュ通知。`community.cancellationAlertEnabled` で ON/OFF 制御
  - Community モデルに `reminderEnabled` + `cancellationAlertEnabled` カラム追加（Prisma マイグレーション: 20260306122317_add_community_notification_settings）
  - PushNotificationIntegrationHandler に FCM 500 トークンバッチ分割対応を追加

---

## 残タスク

- [ ] PI-1: メッセージ全文検索の高度化（ILIKE → pg_trgm → Elasticsearch）
