# Phase 3 — 収支・ビジター機能拡張

> **最終更新**: 2026-03-16
> **ステータス**: ❌ 未着手

## フェーズ概要
- **ゴール**: 収支機能の機能完成（収入タブ + フィルタ）およびビジター機能の拡張（Profile + キャンセル待ちオプション）
- **対象**: W3-11, W3-12, W3-13, W3-14
- **変更対象レイヤー**: UI / API / UseCase / Domain / DB
- **規模**: L（4件。DB変更2件を含む）

## タスク一覧

| タスク                                             | 状態     | 備考 |
| -------------------------------------------------- | -------- | ---- |
| W3-11 収支: 収入タブ（Payment集計）                | ❌ 未着手 |      |
| W3-12 収支: 月別/年別フィルタ                      | ❌ 未着手 |      |
| W3-13 ビジター: VisitorProfileテーブル追加 + CRUD  | ❌ 未着手 |      |
| W3-14 ビジター: キャンセル待ち参加オプション       | ❌ 未着手 |      |

---

## W3-11 収支: 収入タブ（Payment集計）

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **由来**: wave2繰越
- **依存**: wave2 Phase4の収支機能（FinancePage支出タブ）が完了していること

### 仕様
FinancePage に「収入」タブを追加し、Payment テーブルから参加費の集計データを表示する。

| 集計項目 | 算出方法 |
|---------|----------|
| 収入合計 | Payment WHERE status = CONFIRMED の amount 合計 |
| 除外 | REFUNDED（返金済み）、NO_REFUND（返金不要）は含めない |
| 表示粒度 | コミュニティ全体の累計 + アクティビティ別の内訳 |

### 受入条件
- FinancePage に「収入」タブが表示されること
- 支払い済み（CONFIRMED）の合計金額が正しく表示されること
- アクティビティ別の内訳リストが表示されること
- 返金済み・返金不要のPaymentが集計に含まれていないこと

### 関連ファイル（推定）
- `frontend/src/features/expense/pages/FinancePage.tsx` — タブ追加
- `backend/src/application/expense/usecase/` — 収入集計UseCase（新設）
- `backend/src/api/front/expense/` — 収入集計APIエンドポイント（新設）

---

## W3-12 収支: 月別/年別フィルタ

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **由来**: wave2繰越
- **依存**: W3-11（収入タブ）実装後が望ましい

### 仕様
収支ページの支出タブ・収入タブそれぞれに月別/年別の切り替えフィルタを追加する。

| フィルタモード | 動作 |
|---------------|------|
| **全期間**（デフォルト） | 現行通り全件集計 |
| **月別** | 月セレクターで指定月の集計結果を表示 |
| **年別** | 年セレクターで指定年の集計結果を表示 |

- UIはタブ上部にセレクターコンポーネントを配置
- バックエンド: 集計APIに `from` / `to` クエリパラメータを追加（ISO 8601形式）

### 受入条件
- 収支ページ上部に期間フィルタ（全期間/月別/年別）の切り替えUIがあること
- 月別選択時、指定月のデータのみが集計・表示されること
- 年別選択時、指定年のデータのみが集計・表示されること
- フィルタ切替がスムーズに動作すること（ローディング表示あり）

### 関連ファイル（推定）
- `frontend/src/features/expense/pages/FinancePage.tsx` — フィルタUI
- `backend/src/application/expense/usecase/` — 集計UseCaseに期間パラメータ追加
- `backend/src/api/front/expense/` — APIクエリパラメータ追加

---

## W3-13 ビジター: VisitorProfileテーブル追加 + CRUD

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave2繰越
- **依存**: なし

### 仕様
ビジター固有情報を管理する `VisitorProfile` テーブルを新設し、CRUD APIを実装する。

#### DBスキーマ（案）
```
model VisitorProfile {
  id           String    @id @default(uuid())
  communityId  String
  visitorName  String
  email        String?
  phone        String?
  memo         String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  community    Community @relation(fields: [communityId], references: [id])
}
```

- `Participation.visitorName` との関係: VisitorProfile.id を Participation に FK として追加するか、visitorName での名前一致で紐付けるか要設計判断
- コミュニティ単位でビジターを管理（同じビジターが複数コミュニティに参加する場合は別レコード）

### 受入条件
- ゲストビジター追加ダイアログにプロフィール情報（メール・電話・メモ）の入力欄があること
- 入力は全て任意（optional）であること
- 参加者一覧でビジターのプロフィール情報が確認できること（ツールチップまたは詳細展開）
- ビジタープロフィールの編集・削除が可能であること
- 同一コミュニティ内で過去に登録したビジターの候補がサジェストされること

### 関連ファイル（推定）
- `backend/prisma/schema.prisma` — VisitorProfile モデル追加
- `backend/src/domains/` — visitor ドメイン（新設）
- `backend/src/application/` — VisitorProfile CRUD UseCase
- `backend/src/api/front/` — VisitorProfile APIエンドポイント
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — ゲスト追加ダイアログ拡張

---

## W3-14 ビジター: キャンセル待ち参加オプション

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave2繰越
- **依存**: なし

### 仕様
アクティビティ作成/編集画面に「ビジターのキャンセル待ち参加を許可する」オプションを追加する。

#### DBスキーマ変更
```
// Activity テーブルにカラム追加
allowVisitorWaitlist  Boolean  @default(false)
```

| 設定 | 動作 |
|------|------|
| **OFF**（デフォルト） | 定員オーバー時、ビジターはキャンセル待ちリストに入れない。「定員に達しています」エラー |
| **ON** | ビジターも通常メンバーと同様にキャンセル待ちリストに登録可能 |

### 受入条件
- アクティビティ作成/編集フォームに「ビジターのキャンセル待ち参加を許可」チェックボックスがあること
- デフォルトOFF であること
- OFFの場合、定員オーバー時にビジターのキャンセル待ち登録がエラーになること
- ONの場合、ビジターもキャンセル待ちリストに入れること
- 繰り上げ時はW3-10（現金デフォルト自動作成）のルールに従うこと

### 関連ファイル（推定）
- `backend/prisma/schema.prisma` — Activity モデルにカラム追加
- `backend/src/application/participation/` — WaitlistEntry 登録ロジック
- `frontend/src/features/activity/components/ActivityForm.tsx` — チェックボックス追加

---

## 作業ログ
- 2026-03-16: Phase 3 作成。収支2件 + ビジター2件の機能拡張を計画。
