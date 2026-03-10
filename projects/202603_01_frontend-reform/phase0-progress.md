# Phase 0: 共通基盤整備 — 進捗

> 全画面で共通利用する基盤を先に整備（1スレッドで実施）

## タスク一覧

| #   | タスク                       | ステータス | 備考                                                                                                                                                                                      |
| --- | ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-1 | shadcn/ui コンポーネント追加 | ✅ 完了     | `components.json` 作成、`calendar`, `tabs`, `dialog`, `select`, `dropdown-menu`, `avatar`, `badge`, `separator` 追加（8個）                                                               |
| 0-2 | BottomNav 再設計             | ✅ 完了     | ホーム / コミュニティ / アクティビティ / チャット の4タブ。lucide-react アイコンに統一                                                                                                    |
| 0-3 | AppLayout / ヘッダー刷新     | ✅ 完了     | `useMatches()` + `handle` メタデータで動的タイトル・戻るボタン、通知ベルアイコン追加                                                                                                      |
| 0-4 | ルーティング全面再設計       | ✅ 完了     | `createBrowserRouter` + `RouterProvider` に移行。全ルートに `handle: { title, showBack }` 付与。新規ルート追加（/home, /communities/create, /communities/search, /activities, /chats 等） |
| 0-5 | 共通タブコンポーネント       | ✅ 完了     | `SectionTabs.tsx` 作成（shadcn/ui Tabs ベース汎用コンポーネント）                                                                                                                         |

## 変更対象ファイル

### 新規作成
- `frontend/components.json` — shadcn/ui CLI設定（エイリアスを `@/shared/` に合わせてカスタム）
- `frontend/src/shared/types/route.ts` — `RouteHandle` 型定義（ルートメタデータ）
- `frontend/src/shared/components/SectionTabs.tsx` — 共通タブコンポーネント
- `frontend/src/shared/components/ui/tabs.tsx` — shadcn/ui Tabs
- `frontend/src/shared/components/ui/dialog.tsx` — shadcn/ui Dialog
- `frontend/src/shared/components/ui/select.tsx` — shadcn/ui Select
- `frontend/src/shared/components/ui/dropdown-menu.tsx` — shadcn/ui DropdownMenu
- `frontend/src/shared/components/ui/avatar.tsx` — shadcn/ui Avatar
- `frontend/src/shared/components/ui/badge.tsx` — shadcn/ui Badge
- `frontend/src/shared/components/ui/separator.tsx` — shadcn/ui Separator
- `frontend/src/shared/components/ui/calendar.tsx` — shadcn/ui Calendar（react-day-picker）
- `frontend/src/features/home/pages/HomePage.tsx` — Placeholder
- `frontend/src/features/activity/pages/ActivityTopPage.tsx` — Placeholder
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx` — Placeholder
- `frontend/src/features/activity/pages/ActivityEditPage.tsx` — Placeholder
- `frontend/src/features/chat/pages/ChatListPage.tsx` — Placeholder
- `frontend/src/features/community/pages/CommunityCreatePage.tsx` — Placeholder
- `frontend/src/features/community/pages/CommunitySearchPage.tsx` — Placeholder
- `frontend/src/features/community/pages/CommunitySearchDetailPage.tsx` — Placeholder
- `frontend/src/features/community/pages/CommunityJoinPage.tsx` — Placeholder

### 変更
- `frontend/src/app/App.tsx` — `BrowserRouter` → `createBrowserRouter` + `RouterProvider` 移行、全ルート再定義
- `frontend/src/shared/components/AppLayout.tsx` — `<Outlet>` ベースに変換、`AuthProvider` ラップ、`useMatches()` で動的ヘッダー
- `frontend/src/shared/components/BottomNav.tsx` — 4タブ再設計、lucide-react アイコン化
- `frontend/src/shared/components/ProtectedRoute.tsx` — `<Outlet>` ベースのレイアウトルートに変換
- `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/announcement/pages/AnnouncementListPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/activity/pages/ActivityListPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/community/pages/CommunityDetailPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/chat/pages/ChannelPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/payment/pages/PaywallPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/schedule/pages/ScheduleDetailPage.tsx` — 個別戻るボタン削除
- `frontend/src/features/schedule/pages/ScheduleListPage.tsx` — 個別戻るボタン削除

## 技術的な意思決定

### createBrowserRouter 移行
- **理由**: ルート定義に `handle` メタデータを付与し、`useMatches()` で動的にヘッダータイトル・戻るボタンを制御するため
- **AuthProvider の配置**: `AppLayout`（ルートレイアウト）内でラップ。`useNavigate` が Router 内側で必要なため
- **ProtectedRoute**: `children` propsを受け取るラッパー → `<Outlet>` ベースのレイアウトルートに変換

### 戻るボタンの統一
- 各ページに散在していた個別の「← 〇〇一覧」リンク（9箇所）を削除
- AppLayout ヘッダーの `navigate(-1)` で統一的にブラウザ履歴を戻る方式に

## 作業ログ

- 2026-03-01: Phase 0 全タスク完了（0-1〜0-5）。TypeScript 0エラー、Viteビルド成功確認済み
