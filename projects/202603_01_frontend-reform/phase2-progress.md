# Phase 2: コミュニティ系画面 — 進捗

> **最終更新**: 2026-03-04
> **ステータス**: ✅ 実装完了
> コミュニティ一覧・作成・詳細タブ化の6画面をリビルド（4スレッド構成）
> 検索・参加フロー（2-3〜2-5）は Phase 2.5 に分離

---

## 📊 現状分析

### フロントエンド（実装済み）

| ファイル                        | 状態             | 内容                                                               |
| ------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `CommunityListPage.tsx`         | ✅ 機能検証レベル | 一覧 + インラインフォームで作成・削除。カード型UIではない          |
| `CommunityDetailPage.tsx`       | ✅ 機能検証レベル | 編集・画像アップロード・Stripe連携・メンバー表示。タブ型UIではない |
| `CommunityCreatePage.tsx`       | 🔲 Placeholder    | 「Phase 2 で実装予定」表示のみ                                     |
| `CommunitySearchPage.tsx`       | 🔲 Placeholder    | → Phase 2.5 へ移動                                                 |
| `CommunitySearchDetailPage.tsx` | 🔲 Placeholder    | → Phase 2.5 へ移動                                                 |
| `CommunityJoinPage.tsx`         | 🔲 Placeholder    | → Phase 2.5 へ移動                                                 |

**共通基盤（Phase 0 完了済み）**: AppLayout（動的ヘッダー）、BottomNav（4タブ）、SectionTabs、shadcn/ui 13コンポーネント

### バックエンド（実装済み）

| API                | メソッド | パス                                  | 備考                   |
| ------------------ | -------- | ------------------------------------- | ---------------------- |
| コミュニティ作成   | POST     | `/v1/communities`                     | name, description のみ |
| コミュニティ一覧   | GET      | `/v1/communities`                     | 自分が所属するもののみ |
| コミュニティ詳細   | GET      | `/v1/communities/:id`                 | —                      |
| コミュニティ更新   | PATCH    | `/v1/communities/:id`                 | —                      |
| コミュニティ削除   | DELETE   | `/v1/communities/:id`                 | 論理削除               |
| メンバー追加       | POST     | `/v1/communities/:id/members`         | OWNER/ADMIN のみ       |
| メンバー一覧       | GET      | `/v1/communities/:id/members`         | —                      |
| メンバーロール変更 | PATCH    | `/v1/communities/:id/members/:userId` | OWNER のみ             |
| 自分が退会         | DELETE   | `/v1/communities/:id/members/me`      | —                      |

### Prisma — Community モデル（現在）

```prisma
model Community {
  id, name, description, logoUrl, coverUrl, parentId, depth,
  grade("FREE"|"PREMIUM"), createdBy, deletedAt, createdAt, updatedAt
}
```

---

## 🔍 ギャップ分析（モックアップ vs 現状）

### 1. Community モデルのフィールド不足

| フィールド           | 型          | モックアップ出典   | 備考                                                   |
| -------------------- | ----------- | ------------------ | ------------------------------------------------------ |
| `communityTypeId`    | String (FK) | 作成画面           | → `CommunityTypeMaster`                                |
| `categories`         | 多値        | 作成画面・検索画面 | → `CommunityCategory` 中間テーブル                     |
| `mainActivityArea`   | String?     | 作成画面・検索結果 | 例: 品川スポーツセンター                               |
| `joinMethod`         | String      | 作成画面           | `FREE_JOIN` / `APPROVAL` / `INVITATION`                |
| `participationLevel` | 多値        | 作成画面・検索結果 | → `CommunityParticipationLevel` 中間テーブル           |
| `maxMembers`         | Int?        | 作成画面           | 15人刻み (15, 30, 45, ...)                             |
| `isPublic`           | Boolean     | 作成画面           | デフォルト true。false → joinMethod は INVITATION 固定 |
| `activityDays`       | 多値        | 詳細検索           | → `CommunityActivityDay` テーブル                      |
| `activityFrequency`  | String?     | 詳細検索           | 週1回, 月2回, その他                                   |
| `nearestStation`     | String?     | 詳細検索           | 最寄り駅                                               |
| `targetGender`       | String?     | 詳細検索           | 男性, 女性, 指定なし                                   |
| `ageRange`           | String?     | 作成画面           | 20代〜40代 等                                          |
| `tags`               | 多値        | 作成画面           | → `CommunityTag` テーブル                              |

### 2. API 不足（Phase 2 スコープ）

| 必要な変更                     | 用途                               | 現状                   |
| ------------------------------ | ---------------------------------- | ---------------------- |
| `POST /v1/communities` 拡張    | 新フィールドを受け付ける           | name, description のみ |
| `GET /v1/communities` 拡張     | latestAnnouncement 追加（1クエリ） | announcement 情報なし  |
| `GET /v1/communities/:id` 拡張 | 正規化テーブル含む詳細返却         | 基本フィールドのみ     |
| マスタデータ取得 API           | 作成フォームの選択肢をAPIから取得  | ❌ 未実装               |

### 3. API 不足（Phase 2.5 へ移動）

| 必要な API                              | 用途                             | 対応 Phase |
| --------------------------------------- | -------------------------------- | ---------- |
| `GET /v1/communities/search`            | 公開コミュニティ検索             | Phase 2.5  |
| `GET /v1/communities/public/:id`        | 未所属者向け公開コミュニティ詳細 | Phase 2.5  |
| `POST /v1/communities/:id/join`         | 自由参加                         | Phase 2.5  |
| `POST /v1/communities/:id/join-request` | 承認制参加リクエスト             | Phase 2.5  |

---

## 🗄️ テーブル設計（正規化 + マスタ）

### Community テーブル追加カラム（単一値）

| カラム              | 型        | デフォルト                 | 備考                                    |
| ------------------- | --------- | -------------------------- | --------------------------------------- |
| `communityTypeId`   | `String`  | FK → `CommunityTypeMaster` | マスタ参照                              |
| `joinMethod`        | `String`  | `"FREE_JOIN"`              | `FREE_JOIN` / `APPROVAL` / `INVITATION` |
| `isPublic`          | `Boolean` | `true`                     | false → joinMethod は INVITATION 固定   |
| `maxMembers`        | `Int?`    | `null`                     | 15人刻み。null = 無制限                 |
| `mainActivityArea`  | `String?` | `null`                     | 活動エリア（フリーテキスト）            |
| `activityFrequency` | `String?` | `null`                     | 週1回, 月2回, その他                    |
| `nearestStation`    | `String?` | `null`                     | 最寄り駅                                |
| `targetGender`      | `String?` | `null`                     | 男性 / 女性 / 指定なし                  |
| `ageRange`          | `String?` | `null`                     | 20代〜40代 等                           |

### マスタテーブル（全て `name` + `nameEn` + `sortOrder`）

| テーブル                   | 初期データ例                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| `CommunityTypeMaster`      | スポーツ・サークル / 社内・ビジネス / 趣味・オンラインサークル / カルチャー |
| `CategoryMaster`           | バドミントン / バスケ / フットサル / ランニング / テニス / 他               |
| `ParticipationLevelMaster` | 初心者歓迎 / 初級者 / 中級者 / 上級者 / 未経験OK                            |

```prisma
model CommunityTypeMaster {
  id        String   @id @default(uuid())
  name      String   @unique
  nameEn    String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  communities Community[]
}

model CategoryMaster {
  id        String   @id @default(uuid())
  name      String   @unique
  nameEn    String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  communityCategories CommunityCategory[]
}

model ParticipationLevelMaster {
  id        String   @id @default(uuid())
  name      String   @unique
  nameEn    String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  communityLevels CommunityParticipationLevel[]
}
```

### 中間テーブル（マスタ参照）

```prisma
model CommunityCategory {
  id          String @id @default(uuid())
  communityId String
  categoryId  String

  community Community      @relation(fields: [communityId], references: [id], onDelete: Cascade)
  category  CategoryMaster @relation(fields: [categoryId], references: [id])

  @@unique([communityId, categoryId])
  @@index([categoryId])
}

model CommunityParticipationLevel {
  id          String @id @default(uuid())
  communityId String
  levelId     String

  community Community               @relation(fields: [communityId], references: [id], onDelete: Cascade)
  level     ParticipationLevelMaster @relation(fields: [levelId], references: [id])

  @@unique([communityId, levelId])
  @@index([levelId])
}
```

### 値テーブル（マスタ不要）

```prisma
model CommunityActivityDay {
  id          String @id @default(uuid())
  communityId String
  day         String   // 月, 火, 水, 木, 金, 土, 日

  community Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@unique([communityId, day])
}

model CommunityTag {
  id          String @id @default(uuid())
  communityId String
  tag         String

  community Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@unique([communityId, tag])
}
```

### マスタ初期データ（マイグレーション SQL で投入）

```sql
-- CommunityTypeMaster
INSERT INTO "CommunityTypeMaster" (id, name, "nameEn", "sortOrder") VALUES
  ('ct-sports',   'スポーツ・サークル',       'Sports Circle',        1),
  ('ct-corporate','社内・ビジネス',           'Corporate / Business', 2),
  ('ct-hobby',    '趣味・オンラインサークル', 'Hobby / Online',       3),
  ('ct-culture',  'カルチャー',               'Culture',              4);

-- CategoryMaster
INSERT INTO "CategoryMaster" (id, name, "nameEn", "sortOrder") VALUES
  ('cat-badminton', 'バドミントン', 'Badminton',  1),
  ('cat-basketball','バスケ',       'Basketball', 2),
  ('cat-futsal',    'フットサル',   'Futsal',     3),
  ('cat-running',   'ランニング',   'Running',    4),
  ('cat-tennis',    'テニス',       'Tennis',     5),
  ('cat-other',     '他',           'Other',      99);

-- ParticipationLevelMaster
INSERT INTO "ParticipationLevelMaster" (id, name, "nameEn", "sortOrder") VALUES
  ('pl-welcome',     '初心者歓迎', 'Beginners Welcome', 1),
  ('pl-beginner',    '初級者',     'Beginner',          2),
  ('pl-intermediate','中級者',     'Intermediate',      3),
  ('pl-advanced',    '上級者',     'Advanced',          4),
  ('pl-noexp',       '未経験OK',   'No Experience OK',  5);
```

---

## 📋 タスク一覧（スレッド別）

### Thread A: バックエンド — スキーマ拡張 & API 拡張

| #   | タスク                   | ステータス | 詳細                                                                    |
| --- | ------------------------ | ---------- | ----------------------------------------------------------------------- |
| A-1 | Prisma スキーマ拡張      | ✅ 完了     | Community に9カラム追加 + マスタ3テーブル + 中間2テーブル + 値2テーブル |
| A-2 | マスタ初期データ投入     | ✅ 完了     | マイグレーション SQL 内に INSERT                                        |
| A-3 | ドメインモデル拡張       | ✅ 完了     | Community エンティティ / ValueObject に新フィールド追加                 |
| A-4 | CreateCommunity API 拡張 | ✅ 完了     | 新フィールドを受け付けるよう UseCase / Controller 更新                  |
| A-5 | ListCommunities API 拡張 | ✅ 完了     | latestAnnouncement 追加（N+1 回避の1クエリ方式）                        |
| A-6 | FindCommunity API 拡張   | ✅ 完了     | 正規化テーブル含む詳細返却（include）                                   |
| A-7 | マスタデータ取得 API     | ✅ 完了     | `GET /v1/masters/community-types` 等                                    |
| A-8 | テストデータ更新         | ✅ 完了     | 新フィールド付きのテストデータ SQL 更新 + 中間テーブルデータ追加        |

### Thread B: フロントエンド — コミュニティ一覧画面 (2-1)

| #   | タスク                       | ステータス | 詳細                                                                         |
| --- | ---------------------------- | ---------- | ---------------------------------------------------------------------------- |
| B-1 | CommunityListPage リデザイン | ✅ 完了     | チャットリスト風: コミュニティアイコン + 名前 + 最新アナウンスメントタイトル |
| B-2 | CommunityCard コンポーネント | ✅ 完了     | Avatar / コミュニティ名 / 最新ポストタイトル / 日時                          |

**対応ファイル:**
- `frontend/src/features/community/pages/CommunityListPage.tsx` (刷新)
- `frontend/src/features/community/components/CommunityCard.tsx` (新規)

**モックアップ準拠ポイント:**
- ヘッダー: 🔔 + "Communities" + 🔍 + ➕ + プロフィールアバター
- 🔍 → `/communities/search`, ➕ → `/communities/create` へ遷移
- 各行: コミュニティ Avatar + コミュニティ名 + 最新アナウンスメントタイトル + 相対日時
- タップ → `/communities/:id` へ遷移

### Thread C: フロントエンド — コミュニティ作成画面 (2-2)

| #   | タスク             | ステータス | 詳細                                                               |
| --- | ------------------ | ---------- | ------------------------------------------------------------------ |
| C-1 | 作成フォーム実装   | ✅ 完了     | 全フィールドのフォーム構築。マスタデータはAPIから取得              |
| C-2 | 非公開ロジック実装 | ✅ 完了     | isPublic=false → joinMethod を INVITATION に固定、他をグレーアウト |
| C-3 | API 型定義 & 接続  | ✅ 完了     | CreateCommunityRequest 拡張 + communityApi.create 更新             |

**対応ファイル:**
- `frontend/src/features/community/pages/CommunityCreatePage.tsx` (Placeholder → 本実装)
- `frontend/src/shared/types/api.ts` (CreateCommunityRequest 拡張)
- `frontend/src/features/community/api/communityApi.ts` (必要なら更新)

**フォームフィールド（モックアップ準拠）:**

| フィールド       | UI                                  | 必須 | バリデーション           |
| ---------------- | ----------------------------------- | ---- | ------------------------ |
| コミュニティ種別 | セグメントボタン (4択 / マスタ取得) | ✅    | —                        |
| コミュニティ名   | テキスト入力                        | ✅    | 1〜100文字               |
| 主な活動エリア   | テキスト入力                        | —    | —                        |
| カテゴリー       | タグ選択 (複数 / マスタ取得)        | ✅    | 1つ以上                  |
| 参加方式         | ラジオ (3択)                        | ✅    | 非公開時は「招待制」固定 |
| 参加レベル       | タグ選択 (複数 / マスタ取得)        | —    | —                        |
| 上限人数         | ドロップダウン (15人刻み)           | —    | 15, 30, 45, ... 300      |
| 活動頻度         | オプションタグ                      | —    | —                        |
| 活動曜日         | 曜日チップ (複数)                   | —    | —                        |
| 年齢層           | テキスト / ドロップダウン           | —    | —                        |
| タグ             | テキスト入力 (複数)                 | —    | —                        |
| 公開範囲         | トグル + ラジオ                     | ✅    | 公開 / 非公開            |

**ビジネスルール:**
- `isPublic = false` → `joinMethod` を `INVITATION` に強制、他の選択肢はグレーアウト
- `maxMembers` は 15人刻みのドロップダウン (15, 30, 45, ... 300)

### Thread D: フロントエンド — コミュニティ詳細タブ化 (2-6, 2-7, 2-8, 2-9)

| #   | タスク                                    | ステータス | 詳細                                                             |
| --- | ----------------------------------------- | ---------- | ---------------------------------------------------------------- |
| D-1 | CommunityDetailPage タブ化リビルド        | ✅ 完了     | SectionTabs で 4タブ: announcement / activities / chat / album   |
| D-2 | ヘッダー刷新                              | ✅ 完了     | ← 🔔 ⚙️ 📊 コミュニティ名 👥 👥+ プロフィール                         |
| D-3 | Announcement タブ (2-8)                   | ✅ 完了     | 既存 AnnouncementList 埋め込み + 新規作成 FAB                    |
| D-4 | Activities タブ — Calendar サブタブ (2-6) | ✅ 完了     | react-day-picker (shadcn Calendar) + 日付選択→アクティビティ表示 |
| D-5 | Activities タブ — Timeline サブタブ (2-7) | ✅ 完了     | 検索バー + アクティビティリスト（日時・場所・編集アイコン）      |
| D-6 | Album タブ (2-9)                          | ✅ 完了     | アルバムUI（画像グリッド）。API は後追い → BL-6                  |
| D-7 | Chat タブ                                 | ✅ 完了     | 既存チャットページへの導線（タブタップでチャンネルページへ遷移） |
| D-8 | アクティビティ作成 FAB                    | 🔲 Phase 3  | カレンダーアイコンの FAB → アクティビティ作成画面へ遷移          |

**対応ファイル:**
- `frontend/src/features/community/pages/CommunityDetailPage.tsx` (全面リビルド)
- `frontend/src/features/community/components/CommunityDetailHeader.tsx` (新規)
- `frontend/src/features/community/components/AnnouncementTab.tsx` (新規)
- `frontend/src/features/community/components/ActivityCalendarTab.tsx` (新規)
- `frontend/src/features/community/components/ActivityTimelineTab.tsx` (新規)
- `frontend/src/features/community/components/AlbumTab.tsx` (新規)

**モックアップ準拠ポイント:**

**共通ヘッダー (全タブ共通):**
- ← 🔔 ⚙️ 📊 + コミュニティ名 + 👥メンバー + 👥+招待 + プロフィールアバター
- タブバー: `announcement` | `activities` | `chat` | `album`

**Announcement タブ (2-8):**
- お知らせカードリスト（タイトル、リッチカード）
- 右下 FAB: ✏️+ (新規作成)

**Activities — Calendar サブタブ (2-6):**
- サブタブ: `Calendar` | `Timeline`
- 月/年セレクター
- カレンダーグリッド（アクティビティのある日にドット表示）
- 選択日のアクティビティ詳細（名前、日時、場所、編集アイコン）
- 右下 FAB: 📅+ (アクティビティ作成)

**Activities — Timeline サブタブ (2-7):**
- サブタブ: `Calendar` | `Timeline`
- 検索バー
- アクティビティリスト（名前、日時、場所、編集アイコン）
- 右下 FAB: 📅+

**Album タブ (2-9):**
- アルバム名称 + 作成日時 + ⋯メニュー
- 画像グリッド（2列）
- 右下 FAB: 🖼️+
- **API は後追い** → BL-6

---

## 🔗 依存関係 & 実行順序

```
Thread A (Backend)
  ├── A-1〜A-2 スキーマ + マスタ投入
  │     └── A-3 ドメインモデル拡張
  │           ├── A-4 CreateCommunity API 拡張 ──→ Thread C (作成画面)
  │           ├── A-5 ListCommunities 拡張 ──→ Thread B (一覧画面)
  │           ├── A-6 FindCommunity 拡張 ──→ Thread D (詳細タブ)
  │           └── A-7 マスタ取得 API ──→ Thread C (作成フォーム)
  └── A-8 テストデータ更新

Thread B (一覧画面) ── 既存 API でも動作可能、並行着手 OK（A-5 完了で完全版）
Thread D (詳細タブ) ── 既存 API で大部分動作可能、並行着手 OK
```

### 推奨実行順序

| 順序 | スレッド                | 依存                 | 理由                                         |
| ---- | ----------------------- | -------------------- | -------------------------------------------- |
| 🥇 1  | **Thread A (A-1〜A-7)** | なし                 | スキーマ + マスタ + API 拡張。全ての基盤     |
| 🥇 1  | **Thread B**            | なし（A-5 で完全版） | 既存 API でも仮実装可能                      |
| 🥇 1  | **Thread D (D-1〜D-5)** | なし                 | 既存 API で大部分完結                        |
| 🥈 2  | **Thread C**            | A-4, A-7             | 拡張 CreateCommunity API + マスタ API が必要 |
| 🥈 2  | **Thread D (D-6)**      | —                    | Album は UI のみ先行、API は BL-6            |
| 3    | **Thread A (A-8)**      | A-1〜A-7             | 全 API 完了後にテストデータ更新              |

---

## 📁 新規作成ファイル一覧

### バックエンド

| パス                                                                   | 用途                                      |
| ---------------------------------------------------------------------- | ----------------------------------------- |
| `backend/prisma/migrations/YYYYMMDD_community_profile_fields/`         | スキーマ拡張 + マスタ投入マイグレーション |
| `backend/src/domains/community/domain/model/valueObject/JoinMethod.ts` | ValueObject                               |
| `backend/src/api/controllers/masterController.ts`                      | マスタデータ取得コントローラ              |
| `backend/src/api/routes/masterRoutes.ts`                               | マスタルート                              |

### フロントエンド

| パス                                                                   | 用途                 |
| ---------------------------------------------------------------------- | -------------------- |
| `frontend/src/features/community/components/CommunityCard.tsx`         | 一覧用カード         |
| `frontend/src/features/community/components/CommunityDetailHeader.tsx` | 詳細ヘッダー         |
| `frontend/src/features/community/components/AnnouncementTab.tsx`       | アナウンスメントタブ |
| `frontend/src/features/community/components/ActivityCalendarTab.tsx`   | カレンダータブ       |
| `frontend/src/features/community/components/ActivityTimelineTab.tsx`   | タイムラインタブ     |
| `frontend/src/features/community/components/AlbumTab.tsx`              | アルバムタブ         |

---

## 🏷️ バックログ化する項目

| ID   | タスク                               | 理由                                                |
| ---- | ------------------------------------ | --------------------------------------------------- |
| BL-6 | アルバム機能 バックエンド (API + DB) | Phase 2 では UI のみ先行。API は後追い              |
| BL-7 | コミュニティ設定画面 (⚙️)             | ヘッダーの設定アイコンの遷移先は Phase 2 スコープ外 |
| BL-8 | コミュニティ統計画面 (📊)             | ヘッダーの統計アイコンの遷移先は Phase 2 スコープ外 |
| BL-9 | メンバー招待機能                     | 招待制コミュニティの招待フローは Phase 2 スコープ外 |

---

## Mockup

- `frontend/mockup/Communities/` 配下の全PNG
- 補足テキスト:
  - コミュニティ作成画面補足.txt — 上限人数（15人刻み）、参加方式（自由/承認/招待）、非公開→招待制固定

## ビジネスルール

- **コミュニティ作成**: 上限人数はドロップダウン（15人刻み）、参加方式は自由参加/承認制/招待制の3択
- **非公開コミュニティ**: 参加方式が「招待制」に強制固定（他はグレーアウト）

## 作業ログ

- 2026-03-03: Phase 2 詳細プランニング完了。正規化+マスタ設計確定。検索・参加フローを Phase 2.5 に分離。4スレッド構成
- 2026-03-03: Thread A (A-1〜A-7) 完了。Prisma スキーマ拡張・マスタ投入・ドメインモデル拡張・API拡張（Create/List/Find）・マスタAPI新規作成
- 2026-03-03: Thread B (B-1〜B-2) 完了。CommunityListPage チャットリスト風リデザイン + CommunityCard 新規作成
- 2026-03-03: Thread C (C-1〜C-3) 完了。CommunityCreatePage フルフォーム実装（マスタデータAPI連携・非公開ロジック）
- 2026-03-03: Thread D (D-1〜D-7) 完了。CommunityDetailPage 4タブ化（SectionTabs + プロフィールヘッダー + 4タブコンポーネント）
- 2026-03-04: A-8 テストデータ更新完了。Phase 2 新カラム（communityTypeId, joinMethod, isPublic等）+ 中間テーブル（CommunityCategory, CommunityParticipationLevel, CommunityActivityDay, CommunityTag）のテストデータを追加
