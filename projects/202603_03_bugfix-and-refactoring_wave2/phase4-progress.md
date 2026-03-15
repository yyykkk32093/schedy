# Phase 4 — ビジター機能・収支機能（DB/ドメイン変更）

## フェーズ概要
- **ゴール**: DB構造変更を伴う大規模新機能（ビジター機能群・収支機能）を実装する
- **対象**: #12, #31, #36, #37, #38, #39
- **変更対象レイヤー**: UI / API / UseCase / Domain / DB
- **推定規模**: XL（DB設計・マイグレーション・ドメインモデル変更・UI全て必要）

> ⚠️ 本フェーズは設計判断を先に確定させてから着手すること。設計判断事項はwave2-overview.mdの「設計判断が必要な項目一覧」を参照。

---

## サブグループA: ビジター機能（#31, #36, #37, #38, #39）

### 前提: ビジター設計方針

現在のPrismaスキーマには `Participation.isVisitor` フラグが既に存在する。
wave2-overview.mdの設計判断に基づき、**案A（既存Participation.isVisitor活用）** を前提とする。

#### DBマイグレーション（先行実施）
1. `Schedule`テーブルに`visitorFee`カラム追加（Int?, nullable。未設定=通常参加費と同額）
2. 既存データへの影響: なし（nullのまま）

```
-- マイグレーション例
ALTER TABLE "Schedule" ADD COLUMN "visitorFee" INTEGER;
```

---

### #37 アクティビティ詳細: ビジターテーブル設計 ⚠️ 設計判断が必要

- **分類**: 設計変更
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: Domain / DB
- **依存**: なし（本件が他のビジター機能の前提）
- **受入条件**:
  - ビジター参加者がParticipation（isVisitor=true）で管理できること
  - ビジター参加者の登録・取得・削除が正常に動作すること
- **実装方針（概要）**:
  - 既存の`Participation.isVisitor`フラグを活用
  - ビジター参加登録時: `Participation`を`isVisitor=true`で作成
  - ビジター一覧取得: `Participation`の`isVisitor=true`でフィルタリング
  - 将来的にビジター固有情報（連絡先等）が必要になった場合は`VisitorProfile`テーブルを別途追加（wave3以降）
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（Participationモデル確認、Schedule.visitorFee追加）
  - `backend/src/domains/activity/schedule/`
  - `backend/src/application/participation/`

---

### #31 アクティビティ作成: ビジター参加費

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / DB
- **依存**: #37（DB設計確定後）
- **受入条件**:
  - アクティビティ作成・更新画面に「ビジター参加費を設定する」チェックボックスがあること
  - チェックONでビジター参加費の入力欄が表示されること
  - チェックOFFではビジター参加費は保存されないこと（null）
  - 保存後、Schedule.visitorFeeに値が反映されていること
- **実装方針（概要）**:
  - フロント: ActivityFormにチェックボックスと条件付き入力欄を追加
  - バックエンド: スケジュール作成/更新APIでvisitorFeeフィールドを受け付けるよう修正
  - DB: Schedule.visitorFeeカラム追加（マイグレーション）
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/components/ActivityForm.tsx`
  - `backend/src/api/front/schedule/`
  - `backend/src/application/schedule/`
  - `backend/prisma/schema.prisma`

---

### #36 アクティビティ詳細: ビジター参加者追加

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: #37
- **受入条件**:
  - 「参加する」ボタンの横に小さい「ビジター追加」ボタンが配置されていること
  - ボタン押下でビジター候補（Participation.isVisitor対応ユーザ）の一覧が表示されること
  - 選択したビジターがスケジュールの参加者に追加されること（isVisitor=true）
  - 追加後、参加者一覧にビジターとして表示されること
- **実装方針（概要）**:
  - フロント: ActivityDetailPageに「ビジター追加」ボタン→モーダル（ユーザ選択リスト）→追加確認→API呼び出し
  - バックエンド: 参加登録APIでisVisitor=trueの参加を受け付け。ビジター候補ユーザの取得API（コミュニティのビジター有効ユーザ）
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `backend/src/api/front/participation/`
  - `backend/src/application/participation/`

---

### #38 アクティビティ詳細: ビジター参加費表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #31（visitorFeeが保存されていること）
- **受入条件**:
  - ビジター参加費が設定されている場合、通常参加費の横に「（ビジター：¥XXX）」と表示されること
  - 未設定の場合は表示なし
- **実装方針（概要）**:
  - ActivityDetailPageの参加費表示部分で`schedule.visitorFee`がnullでない場合に表示
  - 表示フォーマット: `¥800（ビジター：¥600）`
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`

---

### #39 アクティビティ詳細: ビジター支払い管理

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: #36, #37
- **受入条件**:
  - ビジターの支払い方法と支払い状況の初期状態は「ー」であること
  - 管理者以上（OWNER/ADMIN）に参加者一覧右側にビジター管理ボタンが表示されること
  - ボタン押下でビジターの支払い方法・支払い状況を選択/変更できるモーダルが表示されること
  - 一括選択（全ビジターに同じ支払い方法/状況を設定）が可能であること
  - 個別の設定変更も可能であること
- **実装方針（概要）**:
  - ビジターの支払いはPaymentテーブルで管理（通常参加者と同様）
  - ビジター追加時にPaymentレコードを作成（paymentMethod=null, status=UNPAID、表示上は「ー」）
  - フロント: ビジター管理モーダルにPayment更新UIを追加。一括選択UIはチェックボックス+ドロップダウン
  - バックエンド: ビジター一括支払い更新API
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `backend/src/api/front/participation/` または `backend/src/api/front/schedule/`
  - `backend/src/application/participation/`
  - `backend/src/domains/payment/`

---

## サブグループB: 収支機能（#12）

### #12 コミュニティ詳細: 収支機能追加 ⚠️ 設計判断が必要

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **依存**: なし
- **受入条件**:
  - 集金管理メニューに「収支」が追加されていること
  - 収支・収入・支出の3タブ構成であること
  - **収支タブ**: 収入と支出の差分が表示されること
  - **収入タブ**:
    - 参加費支払い済み（status=CONFIRMED）の合計が表示されること
    - 返金済み（REFUNDED）と返金不要（NO_REFUND）は計算に含めないこと
    - 月単位・年単位で切り替え表示できること
  - **支出タブ**:
    - カテゴリ選択（飲み会・設備利用料・消耗品・ユニフォーム・未分類）して支出を入力できること
    - 月別・年別で支出合計が見れること
    - 月別・年別の中でカテゴリ別に確認できること
    - カスタムカテゴリーはグレーアウト（準備中）で表示
- **実装方針（概要）**:

  #### DB変更
  ```
  model Expense {
    id           String   @id @default(uuid())
    communityId  String
    category     ExpenseCategory
    amount       Int
    description  String?
    date         DateTime
    createdBy    String
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    community    Community @relation(fields: [communityId], references: [id])
    creator      User      @relation(fields: [createdBy], references: [id])
  }

  enum ExpenseCategory {
    DRINKING_PARTY    // 飲み会
    FACILITY_FEE      // 設備利用料
    CONSUMABLES       // 消耗品
    UNIFORM           // ユニフォーム
    UNCATEGORIZED     // 未分類
  }
  ```

  #### バックエンド
  - 支出CRUD API（作成/取得/更新/削除）
  - 収入集計API（Paymentテーブルからstatus=CONFIRMEDの合計を月別/年別で集計）
  - 収支差分API（収入合計 - 支出合計）

  #### フロント
  - 集金管理画面に3タブ（収支/収入/支出）を追加
  - 収入タブ: APIから月別/年別の収入データを取得してグラフ/テーブル表示
  - 支出タブ: 支出登録フォーム + 月別/年別の支出一覧（カテゴリ別フィルタ付き）
  - 収支タブ: 収入-支出の差分を表示
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（Expense新設、ExpenseCategory enum）
  - `backend/src/domains/`（新規: expense/ またはpayment/内）
  - `backend/src/application/`（新規: expense/）
  - `backend/src/api/front/`（新規: expense/）
  - `frontend/src/features/billing/pages/`（または community/components/内に新規）

---

## マイグレーション計画（実施順序）

1. `Schedule.visitorFee`カラム追加（nullable Int）
2. `Expense`テーブル新設 + `ExpenseCategory` enum追加
3. マイグレーション名: `add-visitor-fee-and-expense`

```bash
# backend/ ディレクトリで実行
env $(grep -v '^#' env/.env.local | xargs) pnpm prisma migrate dev --name add-visitor-fee-and-expense
```

---

## 作業手順（推奨順序）
1. **設計判断の確定**: #37（ビジター設計）, #12（収支設計）をレビュー・承認
2. **DBマイグレーション**: Schedule.visitorFee + Expenseテーブルを一括マイグレーション
3. **ビジター機能群**: #37(ドメイン) → #31(作成) → #36(追加) → #38(表示) → #39(管理)
4. **収支機能**: #12（バックエンドAPI → フロントUI）
