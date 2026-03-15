# Phase 0: クリティカルバグ修正 — 進捗

> 全画面に影響する致命的バグとセキュリティ課題を最優先で修正
> **最終更新**: 2026-03-07
> **ステータス**: ✅ Phase 0 完了

## タスク一覧

| #   | タスク                                                  | ステータス | 備考                                                                                                                                                                 |
| --- | ------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-1 | ログイン2度押し問題の修正                               | ✅ 完了     | `onSuccess` で `await qc.invalidateQueries()` に修正。OAuthCallbackPage も同様修正。Cookie設定→/v1/auth/me再フェッチ完了→navigate の順序を保証                       |
| 0-2 | HeaderActionsContext の Maximum update depth エラー修正 | ✅ 完了     | ActivityDetailPage の `useSetHeaderActions` に渡すインラインJSXを `useMemo` で安定化。毎レンダーの参照変化→無限ループを解消                                          |
| 0-3 | フリーテキスト XSS/インジェクション対策確認             | ✅ 完了     | **脆弱性なし確認**。`dangerouslySetInnerHTML` 未使用、Prismaパラメータバインディング済み、Cookie HttpOnly。zodバリデーション導入はPhase 3-10で対応                   |
| 0-4 | お知らせ投稿時の画像非表示修正                          | ✅ 完了     | End-to-End修正: FE型定義+フォーム+詳細ページ、BE Controller→UseCase→Repository で `AnnouncementAttachment` 作成。`uploadFile` は修正不要（既に全メタデータ返却済み） |
| 0-5 | ＋ボタン重複表示（青/黒2つ）の修正                      | ✅ 完了     | ActivitiesTab の冗長FABを削除。CommunityDetailPage の統合FAB（UBL-35）がアクティビティ作成を既にカバー                                                               |

## 変更対象ファイル（想定）

### 0-1: ログイン2度押し
- `frontend/src/features/auth/pages/LoginPage.tsx` — ログイン成功時のナビゲーション処理
- `frontend/src/app/providers/AuthProvider.tsx` — 認証状態変更とナビゲーションの同期

### 0-2: HeaderActionsContext 無限ループ
- `frontend/src/shared/components/HeaderActionsContext.tsx` — useEffect cleanup での setState 競合修正

### 0-3: XSS対策
- フロントエンド: 全フリーテキスト入力コンポーネントの確認（React JSXの自動エスケープ確認）
- バックエンド: Express ミドルウェアでのサニタイズ確認（`backend/src/api/` 配下）
- `dangerouslySetInnerHTML` の使用箇所がないか確認

### 0-4: 画像非表示
- `frontend/src/features/announcement/` — 画像URL表示ロジック
- `frontend/src/features/home/components/FeedCard.tsx` — フィードカードの画像表示

### 0-5: ＋ボタン重複
- `frontend/src/features/community/components/tabs/` — アクティビティタイムラインタブ内のFABボタン

## 技術的な調査ポイント

### 0-1: ログイン2度押し
- `AuthProvider` の認証状態（`isAuthenticated`）が更新されるタイミングと、ナビゲーション（`navigate('/home')`）のタイミングが非同期でずれている可能性
- Cookie設定完了 → 状態更新 → ナビゲーション の順序保証を確認

### 0-2: HeaderActionsContext
- エラースタック: `commitHookEffectListUnmount` → `dispatchSetState` → `HeaderActionsContext.tsx:45`
- useEffect の cleanup 関数内で `setActions(null)` のような処理があり、アンマウント後の setState がレンダーサイクルと衝突
- **修正方針**: cleanup で `isMounted` ref を使うか、`useLayoutEffect` に変更するか検討

### 0-3: XSS
- React は JSX 内のテキストを自動エスケープするため、`dangerouslySetInnerHTML` を使っていなければフロントは安全
- バックエンド側: Prisma のパラメータバインディングによりSQLインジェクションは防御済みのはず
- 確認対象: ユーザ入力をそのまま `innerHTML` に渡している箇所がないか

## 作業ログ

- 2026-03-07: Phase 0 全5タスク実装完了
  - 0-5: ActivitiesTab.tsx の冗長FAB削除 + Plus import除去
  - 0-2: ActivityDetailPage の useSetHeaderActions に useMemo 適用（参照安定化）
  - 0-3: XSS確認完了（dangerouslySetInnerHTML 未使用、Prisma バインディング済み）
  - 0-1: LoginPage + OAuthCallbackPage の onSuccess を async 化、await invalidateQueries 追加
  - 0-4: お知らせ画像 End-to-End 連携（FE: 型定義+フォーム+詳細表示、BE: Controller+UseCase+IRepository+RepositoryImpl+FindUseCase）
