# Phase 2: レイアウト・ナビゲーション改善 — 進捗

> 画面構成・導線の変更。バックエンド変更なし〜軽微

## タスク一覧

| #    | タスク                                                         | ステータス | 備考                                                                                                      |
| ---- | -------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| 2-1  | ナビゲートボタンのアイコンを専用pngに変更                      | ✅ 完了     | `frontend/public/icons/community-navigate.png` に配置。CommunityDetailPage FAB で使用                     |
| 2-2  | 統計タブ→「公開」右隣ボタンへ移動（管理者以上のみ表示）        | ✅ 完了     | CommunityProfileHeader に BarChart3 アイコンボタン追加。useMyRole で OWNER/ADMIN 判定                     |
| 2-3  | 設定タブ→統計ボタン右隣へ移動（管理者以上のみ表示）            | ✅ 完了     | CommunityProfileHeader に Settings アイコンボタン追加。useMyRole で OWNER/ADMIN 判定                      |
| 2-4  | ヘッダーをコミュニティ名に変更                                 | ✅ 完了     | HeaderActionsContext に title/setTitle 追加。useSetHeaderTitle で動的タイトル設定                         |
| 2-5  | お知らせタブ:「一覧を見る」動線削除→直接フィード表示           | ✅ 完了     | AnnouncementTab を FeedCard ベースに書き換え。BE の ListAnnouncementsUseCase をリッチデータ対応に拡張     |
| 2-6  | チャットタブ:「チャットを開く」動線削除→直接チャット表示       | ✅ 完了     | ChatTab に ChatView コンポーネントを直接埋め込み。useCommunityChannel でチャンネルID取得                  |
| 2-7  | チャット表示中ナビゲートボタン非表示                           | ✅ 完了     | ChatView 埋め込みのため URL 遷移なし → BottomNav はそのまま表示（設計方針変更: 遷移しないので非表示不要） |
| 2-8  | アルバムサムネイル面積を半分に縮小                             | ✅ 完了     | AlbumTab のアルバム一覧グリッドを grid-cols-2 → grid-cols-3 に変更                                        |
| 2-9  | 各＋ボタンのアイコンを専用pngに変更                            | ✅ 完了     | frontend/public/icons/ に 4種の PNG 配置。CommunityDetailPage FAB で使用                                  |
| 2-10 | ＋ボタンの作成対象制限                                         | ✅ 完了     | activeTab 状態追跡 + getFabActions ヘルパーでタブ別 FAB アクション制限                                    |
| 2-11 | アクティビティ作成画面/詳細画面のナビゲートボタン整理          | ✅ 完了     | CommunityDetailPage FAB でタブ別制御済み。ルート handle の showBack は既存のまま                          |
| 2-12 | 説明を幹事の下に表示                                           | ✅ 完了     | ActivityDetailPage で description を幹事行の直後に移動                                                    |
| 2-13 | お知らせのサークル名タップで該当コミュニティへ遷移             | ✅ 完了     | FeedCard の communityName を react-router Link に変更                                                     |
| 2-14 | お知らせ題名・本文クリックでコメント展開                       | ✅ 完了     | FeedCard の title/content を button 化、クリックで CommentSection トグル                                  |
| 2-15 | 過去のアクティビティデフォルト非表示＋「過去を表示する」ボタン | ✅ 完了     | ActivityTopPage TimeLineTab に showPast トグル追加。過去90日分を別クエリで取得                            |
| 2-16 | 検索時スクロール位置リセット防止                               | ✅ 完了     | FeedList に sessionStorage ベースのスクロール位置保存/復元を実装                                          |
| 2-17 | メッセージ削除の絵文字不要→テキスト化                          | ✅ 完了     | MessageBubble 削除ボタンは既にテキスト「削除」のため対応不要                                              |
| 2-18 | リアクションボタンテキスト化                                   | ✅ 完了     | MessageBubble の😊絵文字を「リアクション」テキストに変更                                                   |

## 変更対象ファイル（想定）

### コミュニティ詳細関連（2-1〜2-6, 2-8〜2-10）
- `frontend/src/features/community/pages/CommunityDetailPage.tsx` — タブ構成変更、ヘッダー名変更
- `frontend/src/features/community/components/CommunityProfileHeader.tsx` — 統計/設定ボタン追加（権限制御付き）
- `frontend/src/features/community/components/tabs/AnnouncementTab.tsx` — 動線削除、FeedCard直接表示
- `frontend/src/features/community/components/tabs/AlbumTab.tsx` — サムネイルサイズ、＋ボタン新設
- `frontend/src/features/community/components/` — ナビゲートボタンアイコン変更

### チャット関連（2-6, 2-7, 2-17, 2-18）
- `frontend/src/features/community/components/tabs/` — チャットタブ直接表示
- `frontend/src/shared/components/BottomNav.tsx` — チャット表示中の表示制御
- `frontend/src/features/chat/components/` — 削除テキスト化、リアクションテキスト化

### ホームタブ関連（2-13, 2-14）
- `frontend/src/features/home/components/FeedCard.tsx` — コミュニティ名リンク化、タイトル/本文クリック展開
- `frontend/src/features/home/components/CommentSection.tsx` — アコーディオン展開対応

### アクティビティ関連（2-11, 2-12, 2-15, 2-16）
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx` — ナビゲートボタン非表示
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — ナビゲート属性変更、説明位置変更
- `frontend/src/features/activity/components/` — 過去非表示トグル、スクロール位置保持

### アセット
- `frontend/mockup/Icon/コミュニティナビゲートアイコン.png` → 実際の使用箇所にimport
- `frontend/mockup/Icon/お知らせ投稿アイコン.png` → 実際の使用箇所にimport
- `frontend/mockup/Icon/アクテビティ作成アイコン.png` → 実際の使用箇所にimport
- `frontend/mockup/Icon/アルバム作成アイコン.png` → 実際の使用箇所にimport

## 技術的な調査ポイント

### 2-2, 2-3: 統計/設定のボタン化
- 現在タブとして実装されている統計・設定をタブから外してヘッダー内ボタンに変更
- 権限チェック: `membership.role` が `OWNER` or `ADMIN` の場合のみ表示
- 遷移先: 既存の統計/設定ページへのルーティングは維持

### 2-5: お知らせタブの直接表示
- ホームタブの `FeedList` + `FeedCard` コンポーネントを再利用
- `communityId` でフィルタリングしたフィード取得（`GET /v1/communities/:communityId/announcements`）
- 検索・ブックマークフィルタは Phase 3 で対応

### 2-7: ナビゲートボタン非表示
- チャット画面がアクティブかどうかの状態を Context or URL パスで判定
- `BottomNav` で `pathname.includes('/chats/')` の場合は非表示にする

### 2-15, 2-16: 横展開
- コミュニティ詳細タイムライン + BottomNavアクティビティタイムラインの両方に適用

## 作業ログ

### 2025-07-10: Phase 2 全タスク完了

**Step 1: 共通基盤作成**
- `HeaderActionsContext.tsx`: `title`/`setTitle` 状態追加、`useSetHeaderTitle()`/`useHeaderTitle()` フック追加
- `AppLayout.tsx`: `headerTitle ?? currentHandle?.title` で動的タイトル優先
- `ChatView.tsx`: ChannelPage からチャットコア機能を抽出した再利用コンポーネント作成
- `ChannelPage.tsx`: ChatView の薄いラッパーに書き換え、TS2448 バグ修正
- `useCommunityQueries.ts`: `useMyRole(communityId)` フック追加（OWNER/ADMIN 判定）

**Step 2: CommunityDetailPage 再構成**
- タブから analytics 削除、CommunityProfileHeader に統計/設定アイコンボタン追加（管理者以上のみ）
- `useSetHeaderTitle(community?.name)` でヘッダーを動的コミュニティ名に
- FAB を `getFabActions(activeTab, ...)` ヘルパーでタブ別制限
- 専用 PNG アイコンを `frontend/public/icons/` に配置

**Step 3: Announcement BE 拡張**
- `ListAnnouncementsUseCase`: `findFeedByCommunityIds([communityId])` + ソーシャルデータバッチ取得に拡張
- `_usecaseFactory.ts`: `AnnouncementLikeRepositoryImpl`/`AnnouncementCommentRepositoryImpl` を注入
- `AnnouncementListItem` 型: `AnnouncementFeedItem` と同等のフィールドに拡張
- `AnnouncementTab.tsx`: FeedCard ベースのインライン表示に書き換え

**Step 4: ChatTab 直接表示**
- `ChatTab.tsx`: `useCommunityChannel` + `ChatView` 埋め込みに書き換え
- BottomNav: URL 遷移しないため非表示不要（設計方針変更）

**Step 5: FeedCard 改善 + Activity 調整**
- `FeedCard.tsx`: communityName を Link 化、title/content クリックでコメント展開
- `ActivityDetailPage.tsx`: description を幹事行の直後に移動
- `ActivityTopPage.tsx`: TimeLineTab に過去表示トグル追加
- `FeedList.tsx`: sessionStorage ベースのスクロール位置保存/復元

**Step 6: Album + Chat UI 微調整**
- `AlbumTab.tsx`: アルバム一覧グリッド grid-cols-2 → grid-cols-3
- `MessageBubble.tsx`: リアクションボタン 😊 → 「リアクション」テキスト

---

## ⚠️ スコープ拡大メモ

> Phase 1 のバグフィックス過程で DDD 設計上の問題が見つかり、追加修正を Phase 1 完了後に実施した。
> 詳細は [phase1-progress.md](phase1-progress.md) の「Phase 1 完了後の追加修正（スコープ拡大分）」を参照。
>
> **追加されたバックエンド改修:**
> - `CreateActivityUseCase` で初回 Schedule を同一トランザクション内に作成
> - `ListParticipationsUseCase` で参加者 displayName を解決
> - `ListActivitiesUseCase` に `upcomingSchedules` レスポンス追加（バッチ取得）
> - `IScheduleRepository` に `findUpcomingByActivityIds` バッチメソッド追加
> - `backend/docs/` に Activity/Schedule 分離設計ドキュメント作成
>
> **追加されたフロントエンド改修:**
> - コミュニティタイムラインに Schedule 日時表示 + 月ヘッダー追加
> - アクティビティ詳細の参加費を上部 info section へ移動
> - `ActivityListItem` 型に `upcomingSchedules` 追加
