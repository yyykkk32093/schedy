# Phase 3: アクティビティ系画面 — 進捗

> **最終更新**: 2026-03-04
> **ステータス**: ✅ Phase 3 完了

## タスク一覧

| #   | タスク                                 | ステータス | 対応画面                                        | スレッド |
| --- | -------------------------------------- | ---------- | ----------------------------------------------- | -------- |
| 3-1 | アクティビティ画面（カレンダータブ）   | ✅ 完了     | アクテビティ画面（ユーザ）.カレンダータブ.png   | 1        |
| 3-2 | アクティビティ画面（タイムラインタブ） | ✅ 完了     | アクテビティ画面（ユーザ）.タイムラインタブ.png | 1        |
| 3-3 | アクティビティ作成画面                 | ✅ 完了     | アクティビティ作成画面.png                      | 1        |
| 3-4 | アクティビティ更新画面                 | ✅ 完了     | アクティビティ更新画面.png                      | 1        |
| 3-5 | アクティビティ詳細画面                 | ✅ 完了     | アクテビティ詳細画面.png                        | 1        |

## 追加タスク（Phase 3 スコープ内で実施）

| タスク                             | ステータス | 備考                                                    |
| ---------------------------------- | ---------- | ------------------------------------------------------- |
| バックエンドAPI新設（横断取得）    | ✅ 完了     | `GET /v1/users/me/schedules?from=&to=` UseCase + Router |
| フロントAPI層拡張                  | ✅ 完了     | activityApi, apiTypes, useUserSchedules, memberApi 新規 |
| コミュニティ詳細 ActivitiesTab刷新 | ✅ 完了     | カレンダー/タイムライン本実装 + 作成FAB (D-8)           |
| ルーティング拡張                   | ✅ 完了     | `/communities/:communityId/activities/new` ルート追加   |

## バックログ化した項目

| バックログ ID | 内容                    | 理由                                    |
| ------------- | ----------------------- | --------------------------------------- |
| BL-10         | Repeat バックエンド対応 | `recurrenceRule` 未実装。UI Select のみ |
| BL-11         | 参加機能連携            | 既存 Participation API/hooks との結合   |
| BL-12         | 支払い機能連携          | 既存 Payment API/hooks との結合         |

## 技術選定

- **カレンダー**: `react-day-picker`（shadcn/ui Calendar）
  - `modifiers` でアクティビティがある日にドット表示
  - 日付タップでその日のアクティビティ一覧を下部に表示
- **フォームパターン**: `useState` + shadcn/ui（CommunityCreatePage と同一パターン）
- **横断取得API設計**: Schedule 中心 (`GET /v1/users/me/schedules?from=&to=`)
  - カレンダー/タイムラインUIと自然にマッチ（日付ベース）

## 変更対象ファイル

### バックエンド（新規）
- `backend/src/application/schedule/usecase/ListUserSchedulesUseCase.ts`
- `backend/src/api/front/user-schedule/controllers/userScheduleController.ts`
- `backend/src/api/front/user-schedule/routes/userScheduleRoutes.ts`

### バックエンド（変更）
- `backend/src/api/_usecaseFactory.ts` — `createListUserSchedulesUseCase` 追加

### フロントエンド（新規）
- `frontend/src/features/activity/components/ScheduleCard.tsx`
- `frontend/src/features/activity/components/ActivityForm.tsx`
- `frontend/src/features/community/api/memberApi.ts`
- `frontend/src/features/community/hooks/useMemberQueries.ts`

### フロントエンド（刷新）
- `frontend/src/features/activity/pages/ActivityTopPage.tsx`
- `frontend/src/features/activity/pages/ActivityCreatePage.tsx`
- `frontend/src/features/activity/pages/ActivityEditPage.tsx`
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
- `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx`

### フロントエンド（拡張）
- `frontend/src/features/activity/api/activityApi.ts` — `listMySchedules` 追加
- `frontend/src/features/activity/hooks/useActivityQueries.ts` — `useUserSchedules` 追加
- `frontend/src/shared/types/api.ts` — `UserScheduleItem`, `ListUserSchedulesResponse` 追加
- `frontend/src/shared/lib/queryKeys.ts` — `scheduleListKeys.byUser` 追加
- `frontend/src/app/App.tsx` — `/communities/:communityId/activities/new` ルート追加

## 作業ログ

- 2026-03-04: Phase 3 全タスク実装完了。バックエンドAPI新設 + フロント5画面リビルド + ActivitiesTab刷新。BL-10〜12をバックログ化
