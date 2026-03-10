# Phase 2.5: コミュニティ検索・参加フロー — 進捗

> **最終更新**: 2026-03-04
> **ステータス**: ✅ 実装完了
> コミュニティ検索、公開コミュニティ詳細、参加フロー（自由参加/承認制）を実装

---

## 📌 スコープ

Phase 2 から分離した検索・参加フローの3画面 + バックエンド API を対象

### 対象画面

| #   | 画面                 | モックアップ            | 概要                                           |
| --- | -------------------- | ----------------------- | ---------------------------------------------- |
| 2-3 | コミュニティ検索     | `Communities/2-3_*.png` | キーワード検索 + カテゴリフィルター + 詳細検索 |
| 2-4 | 公開コミュニティ詳細 | `Communities/2-4_*.png` | 未所属ユーザー向けの公開プロフィール           |
| 2-5 | コミュニティ参加     | `Communities/2-5_*.png` | 自由参加 / 承認制リクエスト送信                |

### スコープ外（バックログ）

- 参加リクエスト承認/拒否 UI（管理者側）→ 別 Phase or バックログ
- 招待制コミュニティの招待フロー → BL-9

---

## 📋 タスク一覧

### Thread E: バックエンド — 検索・参加 API

| #   | タスク                            | ステータス | 詳細                                                                    |
| --- | --------------------------------- | ---------- | ----------------------------------------------------------------------- |
| E-1 | CommunityJoinRequest テーブル作成 | ✅ 完了     | Prisma スキーマ + マイグレーション                                      |
| E-2 | 公開コミュニティ検索 API          | ✅ 完了     | `GET /v1/communities/search` — contains検索 + AND/OR フィルタ           |
| E-3 | 公開コミュニティ詳細 API          | ✅ 完了     | `GET /v1/communities/public/:id` — 未所属者向け（メンバー情報は限定的） |
| E-4 | 自由参加 API                      | ✅ 完了     | `POST /v1/communities/:id/join` — joinMethod=FREE_JOIN の場合           |
| E-5 | 承認制参加リクエスト API          | ✅ 完了     | `POST /v1/communities/:id/join-request` — joinMethod=APPROVAL の場合    |

### Thread F: フロントエンド — 検索・参加画面

| #   | タスク                         | ステータス | 詳細                                                                             |
| --- | ------------------------------ | ---------- | -------------------------------------------------------------------------------- |
| F-1 | CommunitySearchPage 実装       | ✅ 完了     | 検索バー + カテゴリフィルター + 詳細検索パネル + 検索結果リスト                  |
| F-2 | CommunitySearchDetailPage 実装 | ✅ 完了     | 公開コミュニティプロフィール表示 + 参加ボタン                                    |
| F-3 | CommunityJoinPage 実装         | ✅ 完了     | 参加確認 UI (自由参加 → 即完了 / 承認制 → リクエスト送信)                        |
| F-4 | 検索用 API hooks               | ✅ 完了     | useSearchCommunities, usePublicCommunityDetail, useJoinCommunity, useJoinRequest |

---

## 🗄️ テーブル設計

### CommunityJoinRequest

```prisma
model CommunityJoinRequest {
  id          String   @id @default(uuid())
  communityId String
  userId      String
  status      String   @default("PENDING")  // PENDING / APPROVED / REJECTED
  message     String?  // 申請メッセージ
  reviewedBy  String?  // 承認/拒否した管理者の userId
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  community Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id])

  @@unique([communityId, userId, status])
  @@index([communityId])
  @@index([userId])
}
```

---

## 🔗 依存関係

```
Phase 2 完了（Community スキーマ拡張済み）
  └── Thread E (Backend)
        ├── E-1 JoinRequest テーブル
        ├── E-2 検索 API
        ├── E-3 公開詳細 API
        ├── E-4 自由参加 API ──→ Thread F (F-3)
        └── E-5 承認制 API ──→ Thread F (F-3)
  └── Thread F (Frontend)
        ├── F-1 検索画面 ← E-2
        ├── F-2 公開詳細画面 ← E-3
        └── F-3 参加画面 ← E-4, E-5
```

---

## 📁 新規作成ファイル一覧

### バックエンド

| パス                                                                       | 用途                                 |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `backend/prisma/migrations/YYYYMMDD_community_join_request/`               | JoinRequest テーブルマイグレーション |
| `backend/src/application/community/usecase/SearchCommunitiesUseCase.ts`    | 公開コミュニティ検索                 |
| `backend/src/application/community/usecase/FindPublicCommunityUseCase.ts`  | 公開コミュニティ詳細                 |
| `backend/src/application/community/usecase/JoinCommunityUseCase.ts`        | 自由参加                             |
| `backend/src/application/community/usecase/RequestJoinCommunityUseCase.ts` | 承認制リクエスト                     |

### フロントエンド

| パス                                                                  | 用途                         |
| --------------------------------------------------------------------- | ---------------------------- |
| `frontend/src/features/community/pages/CommunitySearchPage.tsx`       | Placeholder → 本実装         |
| `frontend/src/features/community/pages/CommunitySearchDetailPage.tsx` | Placeholder → 本実装         |
| `frontend/src/features/community/pages/CommunityJoinPage.tsx`         | Placeholder → 本実装         |
| `frontend/src/features/community/components/SearchFilters.tsx`        | 検索フィルターコンポーネント |

---

## 作業ログ

- 2026-03-03: Phase 2.5 進捗ファイル作成。Phase 2 プランニング時に検索・参加フローを分離
- 2026-03-04: Phase 2.5 全タスク完了。バックエンド: CommunityJoinRequestテーブル作成、検索API(contains+AND/ORフィルタ)、公開詳細API、自由参加API、承認制参加リクエストAPI。フロント: API hooks, CommunitySearchPage(検索バー+カテゴリ+詳細検索), CommunitySearchDetailPage(公開プロフィール), CommunityJoinPage(自由参加/承認制)。ヘッダー統一(HeaderActionsContext)も同時実施
