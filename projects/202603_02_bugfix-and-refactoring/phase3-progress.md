# Phase 3: 新機能追加（フロント＋バックエンド） — 進捗

> 新規APIやドメインロジックが必要な機能を実装

## タスク一覧

| #    | タスク                                                      | ステータス | 備考                                                                                                                                                                                                           |
| ---- | ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3-1  | お知らせブックマーク機能（API新設＋UI＋お気に入りフィルタ） | 🔜 未着手   | 🗄️ DBマイグレーション必要。`announcement_bookmarks` テーブル新設。ホームタブ＋コミュニティお知らせタブの両方にお気に入りフィルタ                                                                                |
| 3-2  | お知らせ「…」メニュー：編集（管理者以上）＋ブックマーク     | 🔜 未着手   | 既読後も「…」メニューを残す。管理者以上→「編集する」表示、全員→「ブックマークする」表示                                                                                                                        |
| 3-3  | お知らせ検索機能の実装/修正                                 | 🔜 未着手   | 検索キーの明確化（タイトル + 本文 + コミュニティ名）。フィルタリング動作の修正                                                                                                                                 |
| 3-4  | オンライン/オフライン選択＋会議URLフィールド追加            | 🔜 未着手   | アクティビティ作成: ラジオボタンでオンライン/オフライン選択。URLは任意（URL形式バリデーション）。詳細: オンライン→タップでURLコピー、オフライン→GoogleMapリンク。タイムライン: オンラインマーク表示＋URLコピー |
| 3-5  | 参加費入力（100円単位、デフォルト0円）                      | 🔜 未着手   | アクティビティ作成画面に参加費フィールド追加。100円単位のステッパー or 入力。Schedule の `fee` フィールド活用                                                                                                  |
| 3-6  | 上限人数設定（コミュニティ人数の20%単位＋フリー入力）       | 🔜 未着手   | 上限設定ON/OFFスイッチ。ON時: コミュニティメンバー数の20%単位でセレクト + フリー入力も可                                                                                                                       |
| 3-7  | タイムラインカードに幹事名・参加費・参加人数表示            | 🔜 未着手   | 幹事名（displayName）、参加費（円 or 無料）、参加人数（xx/上限人数）を各カードに追加                                                                                                                           |
| 3-8  | アルバムデフォルト名を当日日付に＋新規作成を＋ボタン経由    | 🔜 未着手   | アルバム名のデフォルト値: `YYYY/MM/DD`。＋ボタン（専用アイコン）から作成                                                                                                                                       |
| 3-9  | チャット既読数表示（ハイブリッド方式）                      | 🔜 未着手   | 🗄️ DBマイグレーション必要。`message_read_receipts` テーブル新設。WS: `message:read`(C→S)で既読送信。REST: メッセージ取得時に`readCount`を付与                                                                   |
| 3-10 | フリーテキストのバリデーション強化                          | 🔜 未着手   | アクティビティ作成画面: タイトル・説明の文字数制限、必須チェック。Zod スキーマ拡充                                                                                                                             |
| 3-11 | 参加するスプリットボタン（支払い方法選択＋「後で支払う」）  | 🔜 未着手   | メインボタン「参加する」+ ドロップダウンで支払い方法選択（CASH/PAYPAY/STRIPE/後で支払う）。参加時に支払い動線に合流                                                                                            |
| 3-12 | キャンセル待ち UI接続（上限時自動切替＋自動繰り上げ）       | 🔜 未着手   | バックエンド実装済み（JoinWaitlistUseCase, 自動繰り上げ）。フロント: 上限到達時「キャンセル待ち」通常ボタンに切替。POST /v1/schedules/:id/waitlist-entries 接続                                                |
| 3-13 | 参加状態→キャンセルボタン切替                               | 🔜 未着手   | 参加済み（ATTENDING）→「キャンセル」ボタン表示。DELETE /v1/schedules/:id/participations/me 接続                                                                                                                |
| 3-14 | 管理者によるメンバー参加者の削除                            | 🔜 未着手   | 管理者以上のユーザがメンバー（OWNER/ADMIN以外）の参加を削除可能。参加者一覧にゴミ箱アイコン表示                                                                                                                |
| 3-15 | カレンダー/タイムラインにゴミ箱マーク（参加取り消し）       | 🔜 未着手   | BottomNavアクティビティタブのタイムライン/カレンダーに、各アクティビティにゴミ箱マーク追加。タップで参加取り消し確認ダイアログ                                                                                 |
| 3-16 | 支払い済みキャンセル時の確認ダイアログ＋管理者通知          | 🔜 未着手   | **確認ダイアログ型**: 支払い済み（CONFIRMED）ユーザがキャンセル時「返金は幹事に直接ご確認ください」警告表示。管理者にOutbox通知送信                                                                            |

## DBマイグレーション（Phase 3 冒頭で実施）

### 3-1: お知らせブックマーク
```sql
-- announcement_bookmarks テーブル
CREATE TABLE announcement_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (announcement_id, user_id)
);
CREATE INDEX idx_announcement_bookmarks_user ON announcement_bookmarks(user_id);
```

### 3-9: チャット既読
```sql
-- message_read_receipts テーブル
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX idx_message_read_receipts_message ON message_read_receipts(message_id);
```

## 変更対象ファイル（想定）

### 3-1, 3-2: ブックマーク機能
- **新規** `backend/prisma/schema.prisma` — `AnnouncementBookmark` モデル追加
- **新規** `backend/src/domains/announcement/domain/entity/AnnouncementBookmark.ts`
- **新規** `backend/src/application/announcement/usecase/ToggleAnnouncementBookmarkUseCase.ts`
- **新規** `backend/src/application/announcement/usecase/GetBookmarkedAnnouncementsUseCase.ts`
- **変更** `backend/src/api/front/announcement/` — ブックマーク CRUD ルート追加
- **変更** `frontend/src/features/home/components/FeedCard.tsx` — 「…」メニュー拡充
- **新規** `frontend/src/features/announcement/api/bookmarkApi.ts`
- **新規** `frontend/src/features/announcement/hooks/useAnnouncementBookmark.ts`
- **変更** `frontend/src/features/home/pages/HomePage.tsx` — お気に入りフィルタボタン追加
- **変更** `frontend/src/features/community/components/tabs/AnnouncementTab.tsx` — 同上

### 3-4: オンライン/オフライン
- **変更** `backend/prisma/schema.prisma` — Schedule に `isOnline`, `meetingUrl` フィールド追加（または既存フィールド活用）
- **変更** `frontend/src/features/activity/components/ActivityForm.tsx` — ラジオボタン＋URLフィールド追加
- **変更** `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — タップ動作分岐
- **変更** `frontend/src/features/activity/components/ScheduleCard.tsx` — オンラインマーク表示

### 3-9: チャット既読数
- **新規** `backend/prisma/schema.prisma` — `MessageReadReceipt` モデル追加
- **変更** `backend/src/integration/socket/chatSocketHandler.ts` — `message:read` イベント追加
- **変更** `backend/src/api/front/chat/` — メッセージ取得時に `readCount` 付与
- **変更** `frontend/src/features/chat/components/` — 既読数表示UI

### 3-11〜3-13, 3-16: 参加ボタン系
- **変更** `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — スプリットボタン、キャンセル待ち、キャンセルボタン
- **変更** `frontend/src/features/participation/` — 各状態に応じたボタン切替ロジック
- **新規** `frontend/src/features/participation/components/ParticipationButton.tsx` — 状態別ボタンコンポーネント
- **変更** `backend/src/application/participation/usecase/CancelParticipationUseCase.ts` — 支払済みキャンセル時の管理者通知追加

## 技術的な設計判断

### 3-4: オンライン判定
- **方式A**: Schedule テーブルに `is_online BOOLEAN` + `meeting_url TEXT` カラム追加
- **方式B**: `location` フィールドの値で判定（"オンライン" 等の文字列）+ `meeting_url` カラム追加
- → **方式A を推奨**: 明示的なフラグの方が型安全でクエリも容易

### 3-9: 既読数のパフォーマンス
- 全メッセージの既読数をリアルタイム更新すると負荷が高い
- **バッチ既読**: チャンネル表示時に未読メッセージを一括既読にする（`message:read` で `channelId` + `lastReadMessageId` を送信）
- **既読数取得**: メッセージ取得APIで `COUNT(message_read_receipts)` を JOIN して返す

### 3-11: スプリットボタン
- メイン: 「参加する」（デフォルト支払い方法 or 無料の場合は直接参加）
- ドロップダウンオプション: コミュニティ設定で有効な支払い方法一覧 + 「後で支払う」
- 参加費0円の場合はスプリット不要（通常の「参加する」ボタン）

### 3-12: キャンセル待ちUI
- バックエンド: `JoinWaitlistUseCase`, `CancelParticipationUseCase`（自動繰り上げ）, `CancelWaitlistUseCase` が**実装済み**
- フロント接続のみ: `isFull` → 「キャンセル待ち」ボタン表示 → `POST /v1/schedules/:id/waitlist-entries`
- 繰り上げ通知: WebSocket `notification:new` で WAITLIST_PROMOTED を受信 → UIリフレッシュ

### 3-16: 支払い済みキャンセル（確認ダイアログ型）
- `participation.paymentStatus === 'CONFIRMED'` の場合のみ確認ダイアログ表示
- ダイアログ内容: 「支払い済みです。キャンセルする場合、返金については幹事に直接ご確認ください。」
- 管理者通知: 既存のOutbox＋通知基盤を利用（`PAID_CANCELLATION_ALERT` タイプ追加）

## 作業ログ

_（Phase 3 着手時に記録）_
