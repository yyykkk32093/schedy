# Phase 3: 新機能追加（フロント＋バックエンド） — 進捗

> 新規APIやドメインロジックが必要な機能を実装

## タスク一覧

| #    | タスク                                                      | ステータス    | 備考                                                                                                                                                                                                         |
| ---- | ----------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3-1  | お知らせブックマーク機能（API新設＋UI＋お気に入りフィルタ） | ✅ 完了        | DB: `AnnouncementBookmark`。BE: IAnnouncementBookmarkRepository + ToggleAnnouncementBookmarkUseCase + Feed/List/Search に isBookmarked。FE: toggleBookmark hook + FeedCard/FeedList/AnnouncementTab フィルタ |
| 3-2  | お知らせ「…」メニュー：編集（管理者以上）＋ブックマーク     | ✅ 完了        | FeedCard: 「…」メニューに編集（管理者のみ）＋ブックマークトグル。AnnouncementCreatePage: `?edit=:id` プリフィルモード。UpdateAnnouncementUseCase 新設                                                        |
| 3-3  | お知らせ検索機能の実装/修正                                 | ✅ 完了        | SearchAnnouncementsUseCase: コミュニティ名も OR 検索対象に追加                                                                                                                                               |
| 3-4  | オンライン/オフライン選択＋会議URLフィールド追加            | ✅ 完了        | DB: Schedule に `isOnline` `meetingUrl` 追加。BE: entity/repo/usecases/controller 全更新。FE: ScheduleCard にオンラインバッジ、ScheduleDetailPage に会議URLリンク                                            |
| 3-5  | 参加費入力（100円単位、デフォルト0円）                      | ✅ 既存        | 既にBE実装済み（Schedule.participationFee）。UIは ScheduleDetailPage に入力フィールドあり                                                                                                                    |
| 3-6  | 上限人数設定（コミュニティ人数の20%単位＋フリー入力）       | ✅ 既存        | 既にBE実装済み（Schedule.capacity）。UIは ScheduleDetailPage に入力フィールドあり                                                                                                                            |
| 3-7  | タイムラインカードに幹事名・参加費・参加人数表示            | ✅ 完了        | BE: ListUserSchedulesUseCase 拡張（organizerName/participantCount/capacity）。FE: ScheduleCard に幹事名・参加費・参加人数行追加                                                                              |
| 3-8  | アルバムデフォルト名を当日日付に＋新規作成を＋ボタン経由    | ✅ 完了        | AlbumTab: 「新規作成」ボタン追加、handleShowCreateForm でデフォルト名「YYYY年M月 アルバム」を自動設定                                                                                                        |
| 3-9  | チャット既読数表示（ハイブリッド方式）                      | 🔜 IdeaBox送り | → IdeaBox I-8 へ移管。実装工数大（DB + WS + REST）のためPhase 3スコープ外                                                                                                                                    |
| 3-10 | フリーテキストのバリデーション強化                          | ✅ 完了        | ActivityForm: 全体Zod化（activityFormSchema + zodResolver + Controller for Select）。startTime < endTime バリデーション付き                                                                                  |
| 3-11 | 参加するスプリットボタン（支払い方法選択＋「後で支払う」）  | ✅ 完了        | ParticipationActionButton 統一コンポーネント新設。SplitButton（CASH/PAYPAY）+ シンプル参加ボタン切替                                                                                                         |
| 3-12 | キャンセル待ち UI接続（上限時自動切替＋自動繰り上げ）       | ✅ 完了        | ParticipationActionButton に WL登録/WL取消ボタン統合。BE自動繰り上げは既存実装                                                                                                                               |
| 3-13 | 参加状態→キャンセルボタン切替                               | ✅ 完了        | ParticipationActionButton に参加取消ボタン統合                                                                                                                                                               |
| 3-14 | 管理者によるメンバー参加者の削除                            | ✅ 完了        | BE: RemoveParticipantByAdminUseCase（権限チェック＋WL繰上げ＋通知）。FE: ScheduleDetailPage 参加者一覧にゴミ箱アイコン（isAdminOrAbove のみ表示）                                                            |
| 3-15 | カレンダー/タイムラインにゴミ箱マーク（参加取り消し）       | ✅ 完了        | FE: ScheduleCard に onRemove prop + Trash2 アイコン。ActivityTopPage の TimeLineTab/CalendarTab で handleRemove 実装（confirm→cancelAttendance→invalidateQueries）                                           |
| 3-16 | 支払い済みキャンセル時の確認ダイアログ＋管理者通知          | ✅ 完了        | BE: CancelParticipationUseCase に PAID_CANCELLATION 通知追加（REPORTED/CONFIRMED 時）。FE: 確認ダイアログはブラウザ confirm で対応                                                                           |

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

### Session 1 — Step 1〜4 実装

**Step 1: DBマイグレーション**
- `AnnouncementBookmark` モデル追加（id, announcementId, userId, createdAt, unique制約）
- `Schedule` に `isOnline Boolean @default(false)`, `meetingUrl String?` 追加
- Migration: `20260310093837_add_bookmark_and_schedule_online`

**Step 2: お知らせ系 BE + FE**
- BE: `IAnnouncementBookmarkRepository` + `AnnouncementBookmarkRepositoryImpl` + `ToggleAnnouncementBookmarkUseCase`
- BE: `UpdateAnnouncementUseCase`（OWNER/ADMIN権限チェック）、Announcement entity に `updateTitle()`/`updateContent()`
- BE: Feed/List/Search UseCase に `isBookmarked` フィールド追加
- BE: SearchAnnouncements — コミュニティ名も OR 検索対象に
- API: `PATCH /v1/announcements/:id`, `POST /v1/announcements/:id/bookmark`
- FE: `announcementApi.update()`, `toggleBookmark()`, `useToggleAnnouncementBookmark`, `useUpdateAnnouncement`
- FE: `FeedCard` — ブックマークトグル + 編集ナビゲーション（管理者のみ）
- FE: `FeedList`, `AnnouncementTab` — ブックマークフィルタ切替
- FE: `AnnouncementCreatePage` — `?edit=:id` プリフィルモード

**Step 3: ActivityForm Zod化 + Schedule拡張 + 横展開**
- FE: `ActivityForm` — useState×10 → useForm + zodResolver + Controller（Select用）、endTime > startTime バリデーション
- BE: Schedule entity/repo/usecases/controller — `isOnline`/`meetingUrl` 全レイヤ対応
- FE: `ScheduleCard` — オンラインバッジ + 会議URL表示
- FE: `ActivitiesTab > TimelineSubTab` — ScheduleCard 統一（インラインカード廃止）、showPast トグル
- FE: `ScheduleDetailPage` — isOnline バッジ + 会議URL リンク
- FE: `AlbumTab` — 「新規作成」ボタン追加、デフォルト名「YYYY年M月 アルバム」

**Step 4: 参加ボタン系 BE + FE**
- BE: `RemoveParticipantByAdminUseCase`（権限チェック + WL繰上げ + `PARTICIPATION_REMOVED_BY_ADMIN` 通知）
- BE: `CancelParticipationUseCase` — 有料参加者キャンセル時に `PAID_CANCELLATION` 通知追加
- BE: `FindScheduleUseCase` — `communityId` をレスポンスに追加（管理者権限チェック用）
- API: `DELETE /v1/schedules/:id/participations/:userId`（管理者除外）
- FE: `ParticipationActionButton` 統一コンポーネント新設（SplitButton / 参加 / キャンセル / WL）
- FE: `ScheduleDetailPage` — ParticipationActionButton 使用、参加者一覧に管理者除外🗑️ボタン、支払確認を isAdminOrAbove ガード
- FE: `participationApi.removeParticipant()`, `useRemoveParticipant` hook

**設計判断（D-7〜D-10）**
| #    | 判断                         | 詳細                                                                      |
| ---- | ---------------------------- | ------------------------------------------------------------------------- |
| D-7  | お知らせ編集 UI              | プリフィル方式（作成画面を流用）。`?edit=:id` の有無で新規/編集モード分岐 |
| D-8  | ActivityForm バリデーション  | 全体 Zod 化。LoginForm の実績あり                                         |
| D-9  | コミュニティ詳細タイムライン | `ScheduleCard` に統一。横展開の保守コスト削減                             |
| D-10 | チャット既読数（3-9）        | IdeaBox I-8 送り。実装工数大                                              |

**ビルド状況**: ✅ FE / ✅ BE — 全ビルド通過

### Session 2 — 残タスク + UI改善 + テストデータ

**対応タスク一覧**
| #      | 内容                         | 備考                                                                                                                                        |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ⑦      | ScheduleCard「：」修正       | communityName 空時に「：」が残る問題を修正                                                                                                  |
| ⑧      | タイムライン日付グルーピング | 左列日付+曜日 / 右列カード群 / 月ヘッダー維持。dateGroup.ts 共通ユーティリティ新設                                                          |
| ⑤      | 参加ボタン状態切替           | myStatus ベースで参加/取消/WL 登録/WL 取消を切替。FindScheduleUseCase 拡張                                                                  |
| ②③④    | ActivityDetailPage改善       | ② participationFee をActivityForm Zodに追加、③ 説明ラベル+アイコン+配置変更、④ 日付に曜日追加                                               |
| ① 3-7  | カード情報追加               | BE: ListUserSchedulesUseCase 拡張（organizerName/participantCount/capacity）。FE: ScheduleCard に表示行追加                                 |
| ① 3-15 | ゴミ箱マーク                 | ScheduleCard に onRemove prop。ActivityTopPage の TimeLineTab/CalendarTab で参加取り消し実装                                                |
| ⑥      | テストデータ                 | home_feed_testdata.sql → e2e-seed-data.sql リネーム。新テーブル対応（Participation/WaitlistEntry/AnnouncementBookmark/isOnline/meetingUrl） |

**新規ファイル**
- `frontend/src/shared/utils/dateGroup.ts` — `groupByMonthAndDate`, `formatDay`, `formatWeekday`, `formatDateLabel`

**変更ファイル（BE）**
- `backend/src/application/schedule/usecase/FindScheduleUseCase.ts` — IParticipationRepository + IWaitlistEntryRepository DI追加。myStatus/attendingCount/waitlistCount 返却
- `backend/src/api/_usecaseFactory.ts` — FindScheduleUseCase に 4リポジトリ注入
- `backend/src/api/front/schedule/controllers/scheduleController.ts` — userId を execute に渡す
- `backend/src/application/schedule/usecase/ListUserSchedulesUseCase.ts` — organizerName/participantCount/capacity 追加（_count + User bulk query）
- `backend/src/application/activity/usecase/CreateActivityUseCase.ts` — participationFee 入力対応
- `backend/infra/database/seeds/testdata/e2e-seed-data.sql` — リネーム + Phase3 新テーブルのシードデータ追加

**変更ファイル（FE）**
- `frontend/src/features/activity/components/ScheduleCard.tsx` — timeOnly / onRemove / "：" 修正 / 幹事名・参加費・参加人数表示
- `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx` — 日付グルーピングレイアウト + CalendarSubTab timeOnly
- `frontend/src/features/activity/pages/ActivityTopPage.tsx` — 日付グルーピング + チェックボックス過去表示 + handleRemove（Timeline/Calendar両方）
- `frontend/src/features/participation/components/ParticipationActionButton.tsx` — myStatus ベース状態切替
- `frontend/src/features/schedule/pages/ScheduleDetailPage.tsx` — myStatus/isFull props
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — ③④⑤ 全適用
- `frontend/src/features/activity/components/ActivityForm.tsx` — participationFee Zod スキーマ + フィールド
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx` — participationFee 送信
- `frontend/src/shared/types/api.ts` — ScheduleListItem/UserScheduleItem/CreateActivityRequest 型拡張

**参照ファイル更新**
- `projects/routine-tasks.md` — テストデータファイル名を e2e-seed-data.sql に更新

**設計判断（D-11〜D-14）**
| #    | 判断                         | 詳細                                                                                                 |
| ---- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| D-11 | myStatus 取得方式            | 既存 FindScheduleUseCase を拡張（別API不要）。Participation + WaitlistEntry を並列クエリ             |
| D-12 | テストデータ範囲             | 主要モデルのみ（User/Community/Activity/Schedule/Participation/WaitlistEntry/Announcement/Bookmark） |
| D-13 | ゴミ箱マーク表示場所         | ホーム/ユーザー側タイムライン・カレンダーのみ。コミュニティ詳細では非表示                            |
| D-14 | タイムライン日付グルーピング | 左列日付+曜日 / 右列カード群 / 月ヘッダー維持 / カレンダーは timeOnly のみ                           |

**ビルド状況**: ✅ FE / ✅ BE — 全ビルド通過


### Session 3 — 指摘対応 + 追加要件（プランニング）

> Session 2 完了後のレビューで発覚したバグ修正 3 件 + ActivityForm 追加要件 4 件 + ActivityDetailPage 拡張 4 件 + ドキュメント 2 件。DB マイグレーション 1 件あり。

#### 指摘一覧

**1. アクティビティ作成画面（ActivityForm）**
| #   | 指摘                                                          | 対応                                                                                                         |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1-1 | 参加費の「100円単位で入力してください」注釈が不要             | `step=100` → `step=1`、ヘルパーテキスト削除                                                                  |
| 1-2 | 時刻ドロップダウン: 9:00 トップ表示＋終了=開始+60分デフォルト | TIME_OPTIONS を 9:00 始まり巡回配列に。watch で開始変更時に終了を自動 +60 分                                 |
| 1-3 | 参加費の通貨単位を i18n overview に注記                       | 202603_06_i18n/overview.md に追記                                                                            |
| 1-4 | オンライン/オフライン選択＋会議URL入力                        | ラジオ（対面/オンライン）。オンライン時のみ URL 入力（任意、入力時は URL 形式バリデーション）。BE まで貫通   |
| 1-5 | 参加上限人数の設定（上限なし/上限あり トグル＋20%刻み候補）   | useMembers のメンバー数 × 20% 刻みの候補。フリー入力可。BE まで貫通                                          |
| 1-6 | 幹事選択（デフォルトは自分、未定も可）                        | 「未定」選択可。organizerUserId を API に送信（未定時は null）。DB: Activity に `organizerUserId` カラム追加 |

**2. アクティビティ詳細画面（ActivityDetailPage）**
| #   | 指摘                                            | 対応                                                                                                       |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 2-1 | 説明ラベルがない                                | FileText アイコン＋「説明：」ラベルを追加                                                                  |
| 2-2 | 参加取り消し後もボタンが取り消しのまま          | mutation.reset() による isSuccess 状態クリア（useEffect + setTimeout 3 秒）                                |
| 2-3 | 日時に曜日がない                                | formatDateLabel で曜日付き表示に変更                                                                       |
| 2-4 | 幹事変更ボタン（管理者のみ）＋モーダル          | ArrowLeftRight アイコン + shadcn Dialog。BE: `PATCH /v1/activities/:id/organizer` + ChangeOrganizerUseCase |
| 2-5 | 場所クリックで Google マップ検索                | `<a>` タグ + `https://www.google.com/maps/search/?api=1&query=...` (FE のみ)                               |
| 2-6 | 支払UIをスプリットボタン → プルダウン方式に変更 | プルダウンで支払方法選択（デフォルト現金）＋「参加する」ボタン。スプリットボタン廃止                       |

#### 実装ステップ（予定）

| Step | 内容                                                         | レイヤ       | 依存    |
| ---- | ------------------------------------------------------------ | ------------ | ------- |
| 1    | Activity に `organizerUserId` カラム追加（マイグレーション） | DB/BE        | なし    |
| 2    | バグ修正: 説明ラベル復元 [2-1]                               | FE           | なし    |
| 3    | バグ修正: 曜日表示復元 [2-3]                                 | FE           | なし    |
| 4    | バグ修正: 参加取消後ボタン状態 [2-2]                         | FE           | なし    |
| 5    | 参加費 100 円制約撤廃 [1-1]                                  | FE           | なし    |
| 6    | 時刻ドロップダウン改善 [1-2]                                 | FE           | なし    |
| 7    | オンライン/オフライン + URL [1-4]                            | FE/BE        | なし    |
| 8    | 参加上限人数 [1-5]                                           | FE/BE        | なし    |
| 9    | 幹事選択（未定可）+ API送信 [1-6]                            | FE/BE        | Step 1  |
| 10   | 幹事変更ボタン + モーダル [2-4]                              | FE/BE        | Step 1  |
| 11   | 場所→Google マップ [2-5]                                     | FE           | なし    |
| 12   | 支払UI: スプリットボタン → プルダウン [2-6]                  | FE           | なし    |
| 13   | i18n overview 通貨単位注記 [1-3]                             | ドキュメント | なし    |
| 14   | phase3-progress.md ログ + FE/BE ビルド確認                   | ドキュメント | 全 Step |

#### 設計判断（D-15〜D-19）
| #    | 判断                         | 詳細                                                                                                                                                      |
| ---- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-15 | 幹事の DB 設計               | Activity に `organizerUserId String?` を追加。null = 未定（表示は「未定」ラベル）。フォールバックなし                                                     |
| D-16 | 幹事「未定」選択肢           | **あり**。デフォルトは自分（ログインユーザー）。「未定」を選択すると `organizerUserId=null` で保存。通知・リマインダー等の追加フローは作らない            |
| D-17 | 支払UI: スプリットボタン廃止 | スプリットボタンは右側の支払方法に気づかず決済するリスクあり → **プルダウン方式**（プルダウンで支払方法選択＋「参加する」ボタン）に変更。デフォルトは現金 |
| D-18 | 「後で支払う」オプション     | **不要**。「現金で参加」= 後で支払うと同義（現金は対面決済のため）。CASH / PAYPAY の 2 択のみ                                                             |
| D-19 | 幹事変更の対象               | Activity の `organizerUserId` を更新する方式。Schedule 単位ではなく Activity 単位（Activity ≒ 定例イベントの幹事を変更する運用）                          |

#### 実装完了ファイル（Session 3）

**DB / Prisma**
- `backend/prisma/schema.prisma` — Activity に `organizerUserId String?` + `@@index([organizerUserId])` 追加（DBは既存マイグレーションで対応済み）

**BE ドメイン層**
- `backend/src/domains/activity/domain/model/entity/Activity.ts` — `organizerUserId` フィールド追加（constructor/create/reconstruct/update/changeOrganizer/getter）
- `backend/src/domains/activity/infrastructure/repository/ActivityRepositoryImpl.ts` — save(create/update) + toDomain に `organizerUserId` 追加

**BE アプリケーション層**
- `backend/src/application/activity/usecase/CreateActivityUseCase.ts` — input に `organizerUserId`/`isOnline`/`meetingUrl`/`capacity` 追加、Schedule.create に貫通
- `backend/src/application/activity/usecase/FindActivityUseCase.ts` — `organizerUserId`/`organizerDisplayName` をレスポンスに追加
- `backend/src/application/activity/usecase/UpdateActivityUseCase.ts` — input に `organizerUserId` 追加、UserId import追加
- `backend/src/application/activity/usecase/ListActivitiesUseCase.ts` — レスポンスに `organizerUserId` 追加
- `backend/src/application/schedule/usecase/ListUserSchedulesUseCase.ts` — `activity.organizerUserId` を select に追加、幹事判定を `organizerUserId ?? createdBy` に変更

**BE API層**
- `backend/src/api/front/activity/controllers/activityController.ts` — create: `organizerUserId`/`isOnline`/`meetingUrl`/`capacity` 追加。update: `organizerUserId` 追加。新規 `changeOrganizer` ハンドラ追加
- `backend/src/api/front/activity/routes/activityRoutes.ts` — `PATCH /v1/activities/:id/organizer` ルート追加

**FE 型定義**
- `frontend/src/shared/types/api.ts` — `CreateActivityRequest` に `organizerUserId`/`isOnline`/`meetingUrl`/`capacity`、`ActivityListItem` に `organizerUserId`、`ActivityDetail` に `organizerDisplayName`、`UpdateActivityRequest` に `organizerUserId`、新規 `ChangeOrganizerRequest`

**FE API / Hooks**
- `frontend/src/features/activity/api/activityApi.ts` — `changeOrganizer()` メソッド追加、`ChangeOrganizerRequest` import
- `frontend/src/features/activity/hooks/useActivityQueries.ts` — `useChangeOrganizer` hook 追加

**FE コンポーネント**
- `frontend/src/features/activity/components/ActivityForm.tsx` — TIME_OPTIONS 9:00始まり巡回配列、開始時刻変更時に+60分自動セット、`step=100`→`step=1`+ヘルパーテキスト削除、Zodスキーマに`isOnline`/`meetingUrl`/`hasCapacity`/`capacity`追加、オンライン/オフラインラジオ+URL入力、定員トグル+ドロップダウン、幹事「未定」選択肢追加+デフォルト自分、`useAuth`でログインユーザー取得
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — FileTextアイコン+「説明：」ラベル、formatDateLabel曜日表示、Google Mapsリンク（ExternalLink）、organizerDisplayName+organizerUserId表示、管理者向けArrowLeftRightアイコン+ChangeOrganizerDialog追加
- `frontend/src/features/participation/components/ParticipationActionButton.tsx` — スプリットボタン廃止→Selectプルダウン(デフォルト現金)+「参加する」ボタン、全mutation成功時に3秒後reset（useEffect+setTimeout）
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx` — `organizerUserId`/`isOnline`/`meetingUrl`/`capacity` 送信
- `frontend/src/features/activity/pages/ActivityEditPage.tsx` — `organizerUserId` 送信 + initialValues に `organizerUserId` 追加

**ドキュメント**
- `projects/202603_06_i18n/overview.md` — 通貨フォーマット注意事項追記

**ビルド状況**: ✅ FE / ✅ BE — 全ビルド通過


### Session 3.1 — 追加指摘対応

> Session 3 完了後のレビュー指摘 8 件を対応。

#### 指摘一覧と対応

| #    | 指摘                                                   | 対応                                                                                                |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| S3-1 | 参加取り消しできない                                   | cancelAttendance/cancelWaitlist の isError 表示が欠落 → 4 mutation 全てにエラーメッセージ表示を追加 |
| S3-2 | 説明の表示がずれている / ラベル・配置変更              | アクティビティ名直下に移動、ラベル「アクティビティ概要」、bg-gray-50 背景、：不使用、改行表示       |
| S3-3 | 参加者リストが急にニョキっと出る                       | 最初から capacity 分の行を常時表示（空スロットは「—」）、max-h-64 + overflow-auto + sticky ヘッダー |
| S3-4 | 開催形式の入力位置を開催場所の上に                     | ActivityForm: 開催形式ラジオ → 会議URL → 開催場所の順に移動                                         |
| S3-5 | オンライン時は開催場所を消す + BE に「オンライン」送信 | isOnline=true 時に開催場所フィールドを非表示。onFormSubmit で defaultLocation='オンライン' を送信   |
| S3-6 | 定員のドロップダウンでフリーテキスト入力も可能に       | Select → Input type=number + `<datalist>` に変更（候補からの選択とフリー入力の両方が可能）          |
| S3-7 | 定員候補をコミュニティメンバー数 × 20%刻みに           | CAPACITY_OPTIONS 定数を廃止 → useMemo で members.length ベースの動的候補に変更                      |
| S3-8 | 開始時刻選択時の +60 分を毎回適用（初回のみではなく）  | `if (!currentEnd)` ガードを削除。開始時刻変更時に常に終了時刻を +60 分にセット                      |

#### 変更ファイル

**FE コンポーネント**
- `frontend/src/features/participation/components/ParticipationActionButton.tsx` — cancelAttendance/cancelWaitlist の isError 表示追加
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — 説明→「アクティビティ概要」ブロック（bg-gray-50）をタイトル直下に移動、参加者テーブル常時 capacity 行表示（max-h-64 scroll）、FileText import 削除
- `frontend/src/features/activity/components/ActivityForm.tsx` — 開催形式を開催場所の上に移動、オンライン時に開催場所非表示+BE送信値「オンライン」、定員を Input+datalist に変更（メンバー数×20%刻み候補）、+60分を毎回適用

**ビルド状況**: ✅ FE / ✅ BE — 全ビルド通過


### Session 4 — 物理削除モデル移行 + AuditLog統合 + Outboxスコープ縮小

> Session 3 のバグ修正（BUG-3.4-3: 参加→取消→再参加で @@unique 衝突）対応中に、
> Participation / WaitlistEntry の status 設計自体が根本原因であることが判明。
> **論理削除（status=CANCELLED）を全廃し物理削除へ移行**。統計・監査用途には専用 AuditLog テーブルを新設。
> 併せて AuditLog の書込方式を Outbox→自己HTTP → **TX内INSERT** に変更し、Outbox は外部システム連携（FCM / LINE）専用に縮小。

#### 背景と経緯

1. **BUG-3.4-3 の根本原因**:
   - `Participation` は `@@unique([scheduleId, userId])` を持つが、`status=CANCELLED` のレコードが残存
   - 再参加時に Prisma の `upsert` を使っても `status` が `CANCELLED` → `ATTENDING` に戻るだけで、`cancelledAt` が null にならない等の不整合が発生
   - `WaitlistEntry` も同様に `status=CANCELLED/PROMOTED` + `@@unique([scheduleId, userId])` で衝突

2. **論理削除 vs 物理削除の検討**:
   - 論理削除のメリット: 既存データが残る
   - 論理削除のデメリット: @@unique 制約と衝突、全クエリに `WHERE status != 'CANCELLED'` が必要、entity に不要メソッド増殖
   - **結論**: `Participation` / `WaitlistEntry` は「現在の状態」のみ管理するテーブル。存在=参加中、削除=キャンセル済。統計用途は AuditLog テーブルへ

3. **AuditLog の命名統一**:
   - 旧: `AuditLog`（認証イベント用、Outbox 経由で自己 HTTP 呼出しで書込）
   - 新: `{Domain}AuditLog` パターン — `AuthAuditLog`, `CommunityAuditLog`, `ParticipationAuditLog`, `WaitlistAuditLog`
   - 書込方式: Outbox→HTTP（非同期） → **TX内 INSERT**（同期、同一トランザクション内で確実に記録）

4. **Outbox スコープ縮小**:
   - 旧: `audit.log`, `user.lifecycle.audit`, `notification.push`, `webhook.line` の 4 routingKey
   - 新: `notification.push`（FCM）, `webhook.line`（LINE Webhook）の **2 routingKey のみ**
   - Outbox = **外部システム連携専用**（リトライ・DLQ の恩恵があるケース）
   - AuditLog = **TX 内 INSERT**（Outbox のリトライは不要、TX の一貫性で十分）

#### Prisma スキーマ変更

**リネーム・カラム変更**
- `AuditLog` → `AuthAuditLog` — `idempotencyKey` 削除、`eventType` → `action`、`@default(uuid())` 追加、`@@index([userId, occurredAt])` 追加
- `Participation` — `status` / `cancelledAt` 削除（物理削除モデルへ）
- `WaitlistEntry` — `status` / `position` / `promotedAt` / `cancelledAt` 削除、index → `[scheduleId, registeredAt]`

**新規テーブル**
- `ParticipationAuditLog` — `scheduleId`, `userId`, `action`(JOINED/CANCELLED/REMOVED_BY_ADMIN), `cancelledAt?`, `paymentMethod?`, `paymentStatus?`, Schedule リレーション
- `WaitlistAuditLog` — `scheduleId`, `userId`, `action`(JOINED/CANCELLED/PROMOTED)

#### 実装サマリ

**ドメイン層 — 新規**
| ファイル                                                                                                   | 概要                           |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `domains/audit/log/domain/model/entity/AuthAuditLog.ts`                                                    | AuthAuditLog エンティティ      |
| `domains/audit/log/domain/repository/IAuthAuditLogRepository.ts`                                           | `save(log): Promise<void>`     |
| `domains/audit/log/infrastructure/repository/AuthAuditLogRepositoryImpl.ts`                                | Prisma 実装                    |
| `domains/community/domain/model/entity/CommunityAuditLog.ts`                                               | CommunityAuditLog エンティティ |
| `domains/community/domain/repository/ICommunityAuditLogRepository.ts`                                      | Repository interface           |
| `domains/community/infrastructure/repository/CommunityAuditLogRepositoryImpl.ts`                           | Prisma 実装                    |
| `domains/activity/schedule/participation/domain/model/entity/ParticipationAuditLog.ts`                     | エンティティ                   |
| `domains/activity/schedule/participation/domain/repository/IParticipationAuditLogRepository.ts`            | interface                      |
| `domains/activity/schedule/participation/infrastructure/repository/ParticipationAuditLogRepositoryImpl.ts` | Prisma 実装                    |
| `domains/activity/schedule/waitlist/domain/model/entity/WaitlistAuditLog.ts`                               | エンティティ                   |
| `domains/activity/schedule/waitlist/domain/repository/IWaitlistAuditLogRepository.ts`                      | interface                      |
| `domains/activity/schedule/waitlist/infrastructure/repository/WaitlistAuditLogRepositoryImpl.ts`           | Prisma 実装                    |

**ドメイン層 — 変更**
| ファイル                         | 変更内容                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Participation.ts`               | `status` / `cancelledAt` / `cancel()` / `reattend()` / `isAttending()` / `getStatus()` / `getCancelledAt()` 削除 |
| `IParticipationRepository.ts`    | `save()` → `add()` + `update()`（支払更新用）+ `delete()`、`countAttending` → `count`                            |
| `ParticipationRepositoryImpl.ts` | `add()` = create, `update()` = update(payment), `delete()` = delete by unique                                    |
| `WaitlistEntry.ts`               | `status` / `position` / `promotedAt` / `cancelledAt` + 全メソッド削除                                            |
| `IWaitlistEntryRepository.ts`    | `save()` → `add()` + `delete()`、`findNextWaiting` → `findNext`、`countWaiting` → `count`                        |
| `WaitlistEntryRepositoryImpl.ts` | `findNext` = `registeredAt: 'asc'`、status フィルタ全削除                                                        |

**ドメイン層 — 削除**
- `ParticipationStatus.ts`, `WaitlistStatus.ts`（不要になった ValueObject）

**UseCase 層 — 変更（参加/WL）**
| UseCase                           | 変更内容                                                  |
| --------------------------------- | --------------------------------------------------------- |
| `AttendScheduleUseCase`           | `save()` → `add()` + AuditLog INSERT(JOINED)              |
| `CancelParticipationUseCase`      | `save()` → `delete()` + AuditLog INSERT(CANCELLED)        |
| `JoinWaitlistUseCase`             | `save()` → `add()` + AuditLog INSERT(JOINED)              |
| `CancelWaitlistUseCase`           | `save()` → `delete()` + AuditLog INSERT(CANCELLED)        |
| `RemoveParticipantByAdminUseCase` | `save()` → `delete()` + AuditLog INSERT(REMOVED_BY_ADMIN) |
| `ReportPaymentUseCase`            | `save()` → `update()`                                     |
| `ConfirmPaymentUseCase`           | `save()` → `update()`                                     |
| `FindScheduleUseCase`             | `status: 'ATTENDING'` フィルタ削除                        |
| `ListParticipationsUseCase`       | `status: 'ATTENDING'` フィルタ削除                        |
| `ListWaitlistEntriesUseCase`      | `status: 'WAITING'` フィルタ削除                          |
| `ListSchedulesUseCase`            | `countAttending()` → `count()`                            |
| `ListUserSchedulesUseCase`        | `status: 'ATTENDING'` フィルタ削除                        |
| `CancelScheduleUseCase`           | `isAttending()` チェック削除                              |
| `ExportAccountingUseCase`         | `status` select/filter 削除                               |
| `ExportCalendarUseCase`           | `status: 'ATTENDING'` フィルタ削除                        |

**UseCase 層 — 変更（統計）**
| UseCase                         | 変更内容                                  |
| ------------------------------- | ----------------------------------------- |
| `GetAbsenceReportUseCase`       | AuditLog テーブルからキャンセル統計を集計 |
| `GetCommunityStatsUseCase`      | `countAttending` → `count`                |
| `ExportParticipationCsvUseCase` | AuditLog テーブルから CSV 出力            |

**UseCase 層 — 変更（認証 → TX 内 AuditLog）**
| UseCase                     | 変更内容                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `SignInPasswordUserUseCase` | TxRepos: `outbox` → `authAuditLog`。IntegrationEventFactory / OutboxEventFactory 削除。TX 内で `authAuditLog.save()` |
| `SignInOAuthUserUseCase`    | 同上。全 4 ブランチで TX 内 `authAuditLog.save()`                                                                    |
| `SignUpUserUseCase`         | TxRepos から `outbox` 削除（signup は Outbox 不使用に）                                                              |
| `RegisterUserService`       | TxRepos: `{ user }` のみに簡素化                                                                                     |

**UseCase 層 — 変更（コミュニティ）**
| UseCase                     | 変更内容                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `CreateCommunityUseCase`    | Outbox / IntegrationEventFactory 削除。TxRepos: `{ community, membership, user, tx }` |
| `CreateSubCommunityUseCase` | 同上。TxRepos: `{ community, membership, user }`                                      |

**インフラ / DI**
| ファイル                            | 変更内容                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `IntegrationEventFactory.ts`        | `fromUserRegistered` / `fromCommunityCreated` 等 4 メソッド削除（switch default → `[]`） |
| `integrationDispatcherRegistrar.ts` | `notification.push` + `webhook.line` の 2 件のみ登録                                     |
| `_usecaseFactory.ts`                | 全 factory 関数を新 Repository/Constructor に合わせて更新                                |
| `outbox-retry-policy.sql`           | `audit.log` / `user.lifecycle.audit` 削除、`notification.push` 追加                      |

**ジョブ**
| ファイル                         | 変更内容                           |
| -------------------------------- | ---------------------------------- |
| `startPaymentReminderWorker.ts`  | `status: 'ATTENDING'` フィルタ削除 |
| `startScheduleReminderWorker.ts` | `status: 'ATTENDING'` フィルタ削除 |

**削除ファイル（旧 Audit 基盤）**
- `domains/audit/log/` — 旧 AuditLog entity, IAuditLogRepository, AuditLogRepositoryImpl
- `application/audit/usecase/RecordAuditLogUseCase.ts`
- `integration/dto/AuditLogIntegrationEventDTO.ts`
- `integration/handler/audit/` — IAuditIntegrationHandler, DefaultAuditIntegrationHandler, AuthLoginSuccessHandler, AuthLoginFailedHandler
- `integration/handler/AuditLogIntegrationHandler.ts`
- `api/integration/audit/` — auditLogIntegrationRoutes, auditLogIntegrationController

**テストファイル変更**
| ファイル                                                             | 変更内容                                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `test/e2e/signup_to_audit.test.ts`                                   | Outbox/AuditLog 検証削除 → 基本 signup E2E のみ                                  |
| `test/e2e/auth_to_audit.test.ts`                                     | Outbox Worker 不使用 → TX 内 AuthAuditLog 直接検証                               |
| `test/e2e/community.test.ts`                                         | Outbox/AuditLog 検証削除（community creation は Outbox 不使用に）                |
| `test/e2e/participation.test.ts`                                     | 物理削除モデルに合わせてアサーション書換                                         |
| `test/application/auth/oauth/usecase/SignInOAuthUserUseCase.test.ts` | FakeOutboxRepository → FakeAuthAuditLogRepository                                |
| `test/e2e/helpers/dbCleanup.ts`                                      | `authAuditLog` / `participationAuditLog` / `waitlistAuditLog` の deleteMany 追加 |
| `test/e2e/serverForTest.ts`                                          | AppSecrets にテスト用 stripe / revenueCat / s3 / fcm ダミー追加                  |
| 13 テストファイル                                                    | `prisma.auditLog` → `prisma.authAuditLog` 一括置換                               |

#### 設計判断（D-20〜D-24）
| #    | 判断                           | 詳細                                                                                                                                                                 |
| ---- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-20 | 物理削除モデル                 | Participation / WaitlistEntry は「現在の状態」を表すテーブル。存在=アクティブ、非存在=キャンセル済。@@unique 衝突を根本解消                                          |
| D-21 | AuditLog テーブル分離          | `{Domain}AuditLog` パターン。ドメインごとに独立テーブル（AuthAuditLog, CommunityAuditLog, ParticipationAuditLog, WaitlistAuditLog）。JOIN 不要、スキーマ独立進化可能 |
| D-22 | TX 内 INSERT                   | AuditLog は同一トランザクション内で INSERT。Outbox のリトライ・DLQ は不要（書込失敗 = 本体操作も失敗 = 一貫性保証）                                                  |
| D-23 | Outbox スコープ縮小            | Outbox は外部システム連携（FCM 通知 / LINE Webhook）専用。内部データ書込に Outbox→自己 HTTP 呼出しは過剰                                                             |
| D-24 | WaitlistEntry の position 廃止 | `registeredAt` の昇順で暗黙的に順番を決定。position カラムの管理コスト（INSERT/DELETE 時の再番）を排除                                                               |

**ビルド状況**: ✅ FE / ✅ BE（server + test）— 全ビルド通過（tsc --noEmit 0 errors）