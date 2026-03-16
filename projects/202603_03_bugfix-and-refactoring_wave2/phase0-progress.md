# Phase 0 — P0 致命的バグ修正

> **最終更新**: 2026-03-15
> **ステータス**: ✅ Phase 0 完了

## フェーズ概要
- **ゴール**: ログアウトが発生する致命的バグ・操作不能バグを全て解消する
- **対象**: #5, #29, #51
- **変更対象レイヤー**: UI（フロント中心）
- **規模**: S

## タスク一覧

| タスク                                       | 状態   | 備考                                                                     |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| 共通: ワイルドカード `*` → NotFoundPage 新設 | ✅ 完了 | 未定義ルート→`/login`リダイレクトの根本原因を解消                        |
| #5 お知らせ: 投稿編集でログアウト            | ✅ 完了 | FeedCard の navigate パス `/create` → `/new` に修正                      |
| #29 アルバム: FABで新規作成でログアウト      | ✅ 完了 | AlbumCreatePage 新設 + ルート追加で他タブと統一                          |
| #51 アクティビティタブ: 参加取り消し失敗     | ✅ 完了 | invalidateQueries キーを `['schedules', 'list', 'user']` に修正（3箇所） |

## 根本原因と修正内容

### 共通原因: ワイルドカードルート → `/login` リダイレクト
- **原因**: `App.tsx` の `{ path: '*', element: <Navigate to="/login" /> }` により、存在しないルートへのアクセスがすべてログイン画面にリダイレクトされていた
- **修正**: `NotFoundPage` コンポーネントを新設し、ワイルドカードルートの遷移先を変更

### #5 お知らせ: 投稿編集でログアウト
- **原因**: `FeedCard.tsx` の `handleEdit` が `/announcements/create?edit=...` に遷移していたが、ルート定義は `/announcements/new`。パス不一致 → ワイルドカード → `/login`
- **修正**: navigate 先を `/announcements/new?edit=...` に修正
- **変更ファイル**: `frontend/src/features/home/components/FeedCard.tsx`

### #29 アルバム: FABで新規作成でログアウト
- **原因**: FAB が `/communities/:id/albums/new` に遷移していたが、このルートが未定義。ワイルドカード → `/login`
- **修正**: `AlbumCreatePage` を新設し、`/communities/:communityId/albums/new` ルートを追加。他タブ（お知らせ・アクティビティ）と同じ FAB → 専用ページ遷移パターンに統一
- **変更ファイル**: `frontend/src/features/album/pages/AlbumCreatePage.tsx`（新規）, `frontend/src/app/App.tsx`

### #51 アクティビティタブ: 参加取り消し失敗
- **原因**: キャンセル API 自体は成功（204）するが、`invalidateQueries({ queryKey: ['user-schedules'] })` のキーが実際のクエリキー `['schedules', 'list', 'user', from, to]` と不一致。キャッシュが更新されずUIに反映されない → ユーザーには「失敗」に見える
- **修正**: 3箇所の invalidation キーを `['schedules', 'list', 'user']`（プレフィックス一致）に修正
- **変更ファイル**:
  - `frontend/src/features/activity/pages/ActivityTopPage.tsx`（CalendarTab + TimeLineTab）
  - `frontend/src/features/participation/hooks/useParticipationQueries.ts`（useCancelAttendance に追加）
  - `frontend/src/features/activity/hooks/useScheduleDnd.ts`
  - `backend/src/application/schedule/usecase/ListUserSchedulesUseCase.ts`（根本原因: Participation JOIN 追加）

### #29 追加修正: AlbumTab インライン新規作成ボタン削除
- **修正**: FAB → AlbumCreatePage に一本化し、AlbumTab 内のインライン「新規作成」ボタン＋フォームを削除
- **変更ファイル**: `frontend/src/features/community/components/tabs/AlbumTab.tsx`

## 作業ログ
- 2026-03-15: Phase 0 全3件 + 共通原因修正を実装完了。型チェック通過。
- 2026-03-15: #51 根本原因を追加修正。ListUserSchedulesUseCase のクエリにParticipation JOINを追加し、参加中のスケジュールのみ返すように修正。AlbumTab のインライン新規作成ボタンも削除。
