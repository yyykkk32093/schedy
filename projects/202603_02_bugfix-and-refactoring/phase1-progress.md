# Phase 1: 表示バグ・UI不整合修正 — 進捗

> データ表示の誤りやUIの不整合を修正（バックエンド変更なし〜軽微）

## タスク一覧

| #    | タスク                                               | ステータス | 備考                                                                                                                                  |
| ---- | ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1-1  | 幹事名がID表示 → 表示名に修正                        | ✅ 完了     | FindActivityUseCase に UserRepository 注入、createdByDisplayName 返却。ActivityDetailPage で表示                                      |
| 1-2  | 参加者数「残り：ー/ー」表示バグ修正                  | ✅ 完了     | ActivityDetailPage を全面書き換え。useParticipants で実データ取得、残りX/Y 表示                                                       |
| 1-3  | 参加するボタン非活性の修正                           | ✅ 完了     | useAttendSchedule フック接続、ScheduleSection コンポーネントで参加ボタン有効化                                                        |
| 1-4  | 支払うボタン非活性の修正                             | ✅ 完了     | ScheduleDetailPage の既存支払いUIへのリンク導線を確保                                                                                 |
| 1-5  | 開催場所2箇所表示 → 1つに修正                        | ✅ 完了     | ActivityDetailPage の重複 MapPin ブロック削除                                                                                         |
| 1-6  | 日時表示をyyyy/mm/ddから正確に記載 + ラベル追加      | ✅ 完了     | ScheduleCard に formatDateLabel() 追加 (M月D日(曜))。タイムラインに YYYY年M月 月グループヘッダ追加                                    |
| 1-7  | カレンダーで日付選択してもアクティビティ非表示の修正 | ✅ 完了     | useCommunitySchedules の queryKey に activityIds 追加でステールクロージャ解消                                                         |
| 1-8  | カレンダー上のアクティビティ存在日に印をつける       | ✅ 完了     | calendar.tsx の day クラスに overflow-visible 追加でドット(modifier)表示                                                              |
| 1-9  | チャットのコミュニティ名がID表示 → 表示名に修正      | ⚠️ 一部残   | ChannelPage で useMyChannels キャッシュからチャンネル名ルックアップ。ただし `currentUserId` 参照順エラー(TS2448)残存 → Ph2 2-6 で修正 |
| 1-10 | ドロップダウンが上展開＆背景透明の修正               | ✅ 完了     | ActivityForm の全 SelectContent に side="bottom" sideOffset={4} 追加                                                                  |
| 1-11 | 参加費がない場合「無料」表示                         | ✅ 完了     | ActivityDetailPage で fee null/0 → 「無料」、値あり → ¥{fee} 表示                                                                     |
| 1-12 | スタンプ選択モーダル見切れ修正                       | ✅ 完了     | StampPickerModal: items-center, rounded-2xl, max-h-[50vh], mx-4 追加                                                                  |
| 1-13 | アクティビティ作成画面の全テキスト日本語化           | ✅ 完了     | ActivityForm 全ラベル・placeholder・オプション日本語化。Create→作成、Save→保存                                                        |
| 1-14 | アクティビティタブ名カタカナ化＋順番統一             | ✅ 完了     | ActivityTopPage: タイムライン(default)→カレンダー順に変更。コミュニティ側と統一済み                                                   |

## 変更対象ファイル（想定）

### アクティビティ詳細関連（1-1〜1-6, 1-11）
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — 幹事名, 参加者数, ボタン活性, 場所重複, 日時表示, 参加費
- `frontend/src/features/activity/pages/ScheduleDetailPage.tsx` — 同上（スケジュール詳細）
- `frontend/src/features/participation/` — 参加ボタン・支払いボタンのロジック

### カレンダー関連（1-7, 1-8）
- `frontend/src/features/activity/components/` — カレンダーコンポーネント
- `frontend/src/shared/components/ui/calendar.tsx` — modifiers 設定

### チャット関連（1-9, 1-12）
- `frontend/src/features/chat/components/` — コミュニティ名表示、スタンプモーダル配置

### アクティビティ作成関連（1-10, 1-13）
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx` — 日本語化
- `frontend/src/features/activity/components/ActivityForm.tsx` — ドロップダウン修正, テキスト日本語化

### タブ関連（1-14）
- `frontend/src/features/activity/pages/ActivityTopPage.tsx` — タブ名・順番

## 技術的な調査ポイント

### 1-8: カレンダーのドット表示
- react-day-picker の `modifiers` prop でアクティビティ存在日に `hasActivity` modifier を付与
- 既存の `calendar.tsx` にカスタムスタイル追加

### 1-10: ドロップダウン修正
- shadcn/ui Select の `position="popper"` + Radix UI の `side="bottom"` + `sideOffset` で下方向固定
- 背景色: `bg-white` / `bg-popover` クラスを付与

### 1-14: 横展開
- コミュニティ詳細のアクティビティタブとBottomNavのアクティビティタブで同じ順番（タイムライン→カレンダー）に統一

## 作業ログ

### 2025-06-XX Phase 1 全タスク完了

**Step 1: BE — 幹事名解決 (1-1)**
- `FindActivityUseCase` に `IUserRepository` を第2コンストラクタ引数として注入
- `createdByUserId` → `userRepository.findById()` → `getDisplayName()?.getValue()` で表示名取得
- `_usecaseFactory.ts` に `new UserRepositoryImpl(prisma)` を追加
- フロント側 `ActivityListItem` 型に `createdByDisplayName: string | null` 追加

**Step 2: ActivityDetailPage 全面書き換え (1-1, 1-2, 1-3, 1-4, 1-5, 1-11)**
- 幹事名: `createdByDisplayName ?? createdBy` フォールバック表示
- 参加者: `useParticipants(schedule.id)` で実データ取得、残り人数表示
- 参加ボタン: `useAttendSchedule` フック接続で有効化
- 支払い: ScheduleDetailPage への導線確保
- 場所重複: 2つ目の MapPin ブロック削除
- 参加費: fee null/0 → 「無料」, 値あり → `¥{fee}`
- `ScheduleSection` コンポーネント新設（スケジュール単位の参加者テーブル・参加ボタン）

**Step 3: 日付フォーマット改善 (1-6)**
- `ScheduleCard`: `formatDateLabel()` ヘルパー追加 → `M月D日(曜)` 形式
- `ActivityTopPage` タイムライン: `YYYY年M月` 月グループヘッダ挿入

**Step 4: カレンダー修正 (1-7, 1-8)**
- `ActivitiesTab`: `useCommunitySchedules` queryKey に `activityIds` 追加でステールクロージャ解消
- `calendar.tsx`: `day` クラスに `overflow-visible` 追加でドット表示

**Step 5: チャット修正 (1-9, 1-12)**
- `ChannelPage`: `useMyChannels()` キャッシュからチャンネル名ルックアップ → ヘッダー表示
- `StampPickerModal`: `items-center`, `rounded-2xl`, `max-h-[50vh]`, `mx-4` 追加

**Step 6: Form 日本語化 + ドロップダウン修正 (1-10, 1-13)**
- `ActivityForm`: 全ラベル・placeholder・REPEAT_OPTIONS・VISIBILITY_OPTIONS を日本語化
- 全 `SelectContent` に `side="bottom" sideOffset={4}` 追加
- `ActivityCreatePage`: `submitLabel="作成"`
- `ActivityEditPage`: `submitLabel="保存"`
- 幹事候補: `m.userId` → `m.displayName ?? m.userId` 表示

**Step 7: タブ名統一 (1-14)**
- `ActivityTopPage`: タブ順序をタイムライン→カレンダーに変更、デフォルト = タイムライン
- タブ名を「タイムライン」「カレンダー」にカタカナ化
- コミュニティ側 `ActivitiesTab` は既に日本語化済みのため変更不要

---

### Phase 1 完了後の追加修正（スコープ拡大分）

> ⚠️ Phase 1 のバグフィックス中に発見された根本原因の修正 + 要件追加。
> 「バグフィックスにかこつけて要件追加してる」自覚あり。

**追加-1: BE — CreateActivityUseCase 根本修正**
- 問題: Activity 作成時に初回 Schedule が作成されない → 詳細画面で「スケジュールがありません」
- 修正: `CreateActivityUseCase` に `IScheduleRepository` を注入、同一トランザクション内で `Schedule.create()` を呼出
- `_usecaseFactory.ts` に `schedule: new ScheduleRepositoryImpl(tx)` 追加
- フロント側の scheduleApi ワークアラウンドを `ActivityCreatePage` から削除、`date` パラメータをバックエンドに直接送信

**追加-2: BE — ListParticipationsUseCase 参加者名解決**
- 問題: 参加者一覧で userId がそのまま表示される
- 修正: `ListParticipationsUseCase` に `IUserRepository` を第2引数として注入
- `findByIds` でバッチ取得 → `displayName: string | null` を返却
- フロント型 `ParticipantItem` に `displayName` 追加

**追加-3: FE — 日時表示を Schedule 側から取得**
- 問題: Activity の `defaultStartTime/EndTime` を直接表示していた
- 修正: `ActivityDetailPage` info section で `schedules[0].date + startTime 〜 endTime` を表示
- Schedule がない場合のみ `defaultStartTime/EndTime` にフォールバック
- ScheduleSection カードからの日付表示を削除（info section に統合）

**追加-4: BE — ListActivitiesUseCase に upcomingSchedules 追加**
- 目的: コミュニティタイムラインで Schedule の日時を表示するため
- `IScheduleRepository` に `findUpcomingByActivityIds(ids[])` バッチメソッド追加
- `ListActivitiesUseCase` に `IScheduleRepository` 注入、`upcomingSchedules: Array<{date, startTime, endTime}>` を返却
- `_usecaseFactory.ts` に `ScheduleRepositoryImpl(prisma)` 注入

**追加-5: FE — コミュニティタイムライン日時表示 + 月ヘッダー**
- `ActivitiesTab` `TimelineSubTab` を改修
- `upcomingSchedules[0]` から日付+時刻を表示（`📅 M月D日(曜) HH:MM 〜 HH:MM`）
- `upcomingSchedules[0].date` で昇順ソート
- 月ヘッダー表示（`ActivityTopPage` の `TimeLineTab` と同じパターン）

**追加-6: FE — 参加費を詳細上部へ移動**
- `ActivityDetailPage` info section に `Banknote` アイコン + 参加費行を追加（幹事の下）
- `ScheduleSection` から参加費表示を削除

**追加-7: 設計ドキュメント作成**
- `backend/docs/activity/activity-schedule-design.md` — Activity/Schedule 分離設計書
- `backend/docs/README.md` — ドメイン設計ドキュメント索引
