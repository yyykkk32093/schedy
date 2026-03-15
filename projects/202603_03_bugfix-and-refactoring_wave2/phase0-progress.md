# Phase 0 — P0 致命的バグ修正

## フェーズ概要
- **ゴール**: ログアウトが発生する致命的バグ・操作不能バグを全て解消する
- **対象**: #5, #29, #51
- **変更対象レイヤー**: UI（フロント中心）、一部API/UseCase
- **推定規模**: S（3件、いずれもフロントのルーティング/イベント処理の問題と推定）

## 共通調査方針
ログアウトが発生するパターンは以下のいずれかと推定される:
1. 認証が必要なAPIへの未認証リクエスト → 401 → フロントのインターセプターがログアウト処理を実行
2. ルーティングエラーで認証画面にリダイレクト
3. イベントハンドラ内の未処理例外でステート破壊

→ まず `frontend/src/shared/lib/apiClient.ts` の401ハンドリングと、各画面のイベントハンドラを確認すること。

---

## #5 お知らせ: 投稿編集でログアウト

- **分類**: バグ修正
- **優先度**: P0
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - お知らせ投稿の「編集する」ボタンを押しても、ログアウトが発生しないこと
  - 編集画面に正しく遷移し、既存の投稿内容がフォームにプリセットされること
  - 編集→保存が正常に完了すること
- **実装方針（概要）**:
  - `frontend/src/features/announcement/pages/` 内の編集遷移ロジックを調査
  - ルーティングパスの誤りまたはAPIリクエストの認証ヘッダー欠落を確認
  - イベントハンドラ内でのエラーハンドリングを追加
- **関連ファイル（推定）**:
  - `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx`
  - `frontend/src/features/announcement/pages/AnnouncementCreatePage.tsx`（編集兼用の可能性）
  - `frontend/src/features/announcement/api/`
  - `frontend/src/shared/lib/apiClient.ts`

---

## #29 アルバム: FABで新規作成しようとするとログアウト

- **分類**: バグ修正
- **優先度**: P0
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - アルバムタブのFABボタン押下でログアウトが発生しないこと
  - FABボタン押下でアルバム新規作成画面（またはダイアログ）が表示されること
- **実装方針（概要）**:
  - `frontend/src/features/community/components/detail/tabs/AlbumTab.tsx` のFABクリックハンドラを調査
  - アルバム作成APIへのリクエストパス・認証ヘッダーを確認
  - #5と同根の可能性あり（共通の原因を先に特定すること）
- **関連ファイル（推定）**:
  - `frontend/src/features/community/components/detail/tabs/AlbumTab.tsx`
  - `frontend/src/features/album/api/albumApi.ts`
  - `frontend/src/features/album/hooks/useAlbumQueries.ts`
  - `frontend/src/shared/lib/apiClient.ts`

---

## #51 アクティビティタブ: 参加取り消しに失敗

- **分類**: バグ修正
- **優先度**: P0
- **変更対象**: 両方（フロント + バックエンド）
- **変更レイヤー**: UI / API / UseCase
- **依存**: なし
- **受入条件**:
  - カレンダータブからの参加取り消しが成功すること
  - タイムラインタブからの参加取り消しが成功すること
  - 取り消し後、参加者一覧から自分が除外されていること
  - 取り消し後、UIが即時更新されること（リロード不要）
- **実装方針（概要）**:
  - フロント: 参加取り消しAPIの呼び出しパラメータ（scheduleId, userId）を確認
  - バックエンド: `backend/src/api/front/participation/` の取り消しエンドポイント、`backend/src/application/participation/` のUseCaseを調査
  - エラーレスポンスの内容を確認（400/404/500のいずれか）
  - フロント側のキャッシュ無効化（React Queryのinvalidation）が正しく行われているか確認
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `frontend/src/features/activity/components/ScheduleCard.tsx`
  - `frontend/src/features/participation/` （存在する場合）
  - `backend/src/api/front/participation/`
  - `backend/src/application/participation/`
  - `backend/src/domains/activity/schedule/`

---

## 作業手順
1. まず3件のバグに共通するパターンがないか調査（apiClient.tsの401ハンドリング等）
2. 共通原因があれば先に修正
3. 個別のバグを#5 → #29 → #51の順に修正
4. 各修正後に手動テストで再発しないことを確認
