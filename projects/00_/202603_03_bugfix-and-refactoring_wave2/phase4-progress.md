# Phase 4 — ビジター機能・収支機能（DB/ドメイン変更）

> **最終更新**: 2025-07-14
> **ステータス**: ✅ Phase 4 完了

## フェーズ概要
- **ゴール**: DB構造変更を伴う大規模新機能（ビジター機能群・収支機能）を実装する
- **対象**: #12, #31, #36, #37, #38, #39
- **変更対象レイヤー**: UI / API / UseCase / Domain / DB
- **実施規模**: XL（DB設計・マイグレーション・ドメインモデル変更・UI全て実施）

---

## 確定した設計判断

| #   | テーマ                       | 選択案 | 概要                                                   |
| --- | ---------------------------- | ------ | ------------------------------------------------------ |
| 1   | Visitor テーブル設計         | **A**  | 既存 isVisitor + userId nullable + visitorName/addedBy |
| 2   | Visitor 参加費 DB            | **A**  | Schedule.visitorFee カラム (nullable Int)              |
| 3   | Expense カテゴリ             | **B**  | ExpenseCategory マスターテーブル（enumではなく）       |
| 4   | PaymentMethod 初期値         | **A**  | nullable（null = 未定、表示上「ー」）                  |
| 5   | Guest visitor ID 管理        | **B**  | userId nullable + visitorName + addedBy                |
| 6   | Payment-Participation リンク | **A**  | participationId FK + userId nullable                   |

---

## タスク一覧

| タスク                   | 状態   | 備考                                                                     |
| ------------------------ | ------ | ------------------------------------------------------------------------ |
| #37 ビジターテーブル設計 | ✅ 完了 | Participation.userId nullable化 + visitorName/addedBy/participationId FK |
| #31 ビジター参加費       | ✅ 完了 | Schedule.visitorFee カラム + ActivityForm UI + API                       |
| #36 ビジター参加者追加   | ✅ 完了 | AddGuestVisitorUseCase + ゲスト追加ダイアログUI                          |
| #38 ビジター参加費表示   | ✅ 完了 | ActivityDetailPage に visitorFee 表示                                    |
| #39 ビジター支払い管理   | ✅ 完了 | UpdateVisitorPaymentUseCase + API + ゲスト名表示                         |
| #12 収支機能             | ✅ 完了 | ExpenseCategory テーブル + Expense CRUD + FinancePage (2タブ)            |

---

## 実装概要

### DBマイグレーション（2件）
1. **visitor-expense-schema**: Schedule.visitorFee, Participation.userId nullable化, visitorName/addedBy追加, Payment.participationId FK, ExpenseCategory/Expense テーブル新設
2. **participation-partial-unique-index**: Participation の userId+scheduleId partial unique index（userId IS NOT NULL のみ）

### バックエンド新規APIエンドポイント（7件）
- `POST /v1/schedules/:id/guest-visitors` — ゲストビジター追加
- `PATCH /v1/participations/:participationId/visitor-payment` — ビジター支払い更新
- `GET /v1/communities/:communityId/expense-categories` — 支出カテゴリ一覧
- `GET /v1/communities/:communityId/expenses` — 支出一覧
- `POST /v1/communities/:communityId/expenses` — 支出登録
- `DELETE /v1/communities/:communityId/expenses/:expenseId` — 支出削除
- `GET /v1/communities/:communityId/finance/summary` — 収支サマリー

### フロントエンド新規ファイル
- `frontend/src/features/expense/api/expenseApi.ts`
- `frontend/src/features/expense/hooks/useExpenseQueries.ts`
- `frontend/src/features/expense/pages/FinancePage.tsx`（2タブ: 収支/支出）

### フロントエンド主要変更
- `api.ts`: 型定義追加（visitorFee, guest visitor, expense 関連）
- `ActivityForm.tsx`: ビジター参加費入力欄追加
- `ActivityDetailPage.tsx`: visitorFee表示 + ゲスト追加ダイアログ + ゲスト名表示
- `ActivityCreatePage/EditPage`: visitorFee マッピング追加
- `ScheduleDetailPage.tsx`: nullable userId 対応
- `ActivitiesTab.tsx`: visitorFee マッピング追加
- `App.tsx`: /communities/:id/finance ルート追加
- `CommunityProfileHeader.tsx`: 経費管理メニュー追加

---

## 型チェック結果
- **バックエンド**: `npx tsc --noEmit` → ゼロエラー ✅
- **フロントエンド**: `npx tsc --noEmit` → ゼロエラー ✅

---

## テストデータ
- `e2e-seed-data.sql` Section 10 追加: visitorFee設定、ゲストビジター参加、Payment、ExpenseCategory プリセット、Expense サンプル

---

## 今後のバックログ候補
- 収入タブ（Payment集計ベース）
- 月別/年別フィルタ機能
- カスタムカテゴリ追加機能（現在は「準備中」表示）
- ビジター一括支払い更新UI
- VisitorProfile テーブル追加（連絡先等）

---

## 作業ログ
- 2025-07-14: Phase 4 全タスク実装完了。設計判断6件確定、DBマイグレーション2件、バックエンド全層、フロントエンド全層、テストデータ更新。両方ゼロエラーコンパイル確認。
