# Phase 1: Home画面（アナウンスメントフィード） — 進捗

> 所属コミュニティのアナウンスメントをSNSフィード風に一覧表示するHome画面を構築

## タスク一覧

| #   | タスク                               | ステータス | 備考                                                                                                                   |
| --- | ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1-1 | バックエンド: リポジトリ横断取得追加 | ✅ 完了     | `IAnnouncementRepository` に `findFeedByCommunityIds` 追加。Prisma で User・Community JOIN、カーソルページネーション   |
| 1-2 | バックエンド: UseCase新設            | ✅ 完了     | `GetAnnouncementFeedUseCase` — 所属コミュニティ取得 → 横断取得 → 既読状態付与 → DTO返却                                |
| 1-3 | バックエンド: ルート・コントローラ   | ✅ 完了     | `GET /v1/announcements/feed` 追加（`cursor`, `limit` クエリパラメータ対応）                                            |
| 1-4 | バックエンド: DI設定                 | ✅ 完了     | `usecaseFactory.createGetAnnouncementFeedUseCase()` 追加                                                               |
| 1-5 | フロントエンド: API・型定義          | ✅ 完了     | `homeApi.ts` 新規、`api.ts` に `AnnouncementFeedItem` / `AnnouncementFeedResponse` 型追加、queryKeys追加               |
| 1-6 | フロントエンド: hooks                | ✅ 完了     | `useHomeFeed.ts` — `useInfiniteQuery` でカーソルページネーション対応                                                   |
| 1-7 | フロントエンド: コンポーネント       | ✅ 完了     | `FeedCard.tsx`（アバター + 投稿者名 in コミュニティ名 + 相対時刻 + 3ドットメニュー）、`FeedList.tsx`（無限スクロール） |
| 1-8 | フロントエンド: HomePage置換         | ✅ 完了     | Placeholderからフィード画面に置き換え                                                                                  |

## Mockup

- `frontend/mockup/Home/Home画面.png`

## 変更対象ファイル

### 新規作成
- `backend/src/application/announcement/usecase/GetAnnouncementFeedUseCase.ts` — フィード取得UseCase + DTO型定義
- `frontend/src/features/home/api/homeApi.ts` — フィードAPI関数
- `frontend/src/features/home/hooks/useHomeFeed.ts` — TanStack Query infinite query hook
- `frontend/src/features/home/components/FeedCard.tsx` — フィードカードコンポーネント
- `frontend/src/features/home/components/FeedList.tsx` — フィードリスト（無限スクロール）

### 変更
- `backend/src/domains/announcement/domain/repository/IAnnouncementRepository.ts` — `AnnouncementFeedRow` 型 + `findFeedByCommunityIds` メソッド追加
- `backend/src/domains/announcement/infrastructure/repository/AnnouncementRepositoryImpl.ts` — `findFeedByCommunityIds` Prisma実装追加
- `backend/src/api/front/announcement/controllers/announcementController.ts` — `feed` ハンドラ追加
- `backend/src/api/front/announcement/routes/announcementRoutes.ts` — `GET /v1/announcements/feed` ルート追加
- `backend/src/api/_usecaseFactory.ts` — `createGetAnnouncementFeedUseCase` ファクトリメソッド追加
- `frontend/src/shared/types/api.ts` — `AnnouncementFeedItem`, `AnnouncementFeedResponse` 型追加
- `frontend/src/shared/lib/queryKeys.ts` — `announcementFeedKeys` 追加
- `frontend/src/features/home/pages/HomePage.tsx` — Placeholder → FeedList 組み込み

## 技術的な意思決定

### フィード取得方式
- **横断取得**: バックエンド側で `GET /v1/announcements/feed` を新設し、所属コミュニティのアナウンスメントをまとめて返却
- **フロントで各コミュニティAPIを個別呼び出し** は N+1 問題が発生するため不採用
- **カーソルページネーション**: `createdAt` DESC + ID ベースカーソルで無限スクロール対応

### 3ドットメニュー
- Phase 1 では「既読にする」のみ対応（既存API `PATCH /v1/announcements/:id/read` 活用）
- 「非表示」「通報」等は将来追加

### バックログへ切り出した機能
- いいね・コメント・画像添付・検索バー・ヘッダープロフィールアバター → `phase_backlog_frontend_progress.md` 参照

## 作業ログ

- 2026-03-03: Phase 1 全タスク完了（1-1〜1-8）。TypeScript 0エラー、Viteビルド成功確認済み

_（スレッド実施時に記録）_
