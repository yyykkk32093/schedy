# Phase 1 — 小規模整理・改善

> **最終更新**: 2026-03-18
> **ステータス**: ✅ Phase 1 完了

## フェーズ概要
- **ゴール**: フロント中心の小規模な整理・改善をまとめて実施する
- **対象**: W3-02, W3-03, W3-04, W3-05, W3-06
- **変更対象レイヤー**: UI / API / UseCase
- **規模**: M（5件。フロントのみ完結2件 + バックエンド修正3件）

## タスク一覧

| タスク                                             | 状態     | 備考                                                 |
| -------------------------------------------------- | -------- | ---------------------------------------------------- |
| W3-02 お気に入り概念整理（クリップ/ブックマーク）  | ✅ 完了   | Paperclipアイコン + 青色 + 「クリップ」ラベル        |
| W3-03 フリーテキスト最大文字数の棚卸し・統一       | ✅ 完了   | BE ValueObject定数化 + FE maxLength/CharacterCounter |
| W3-04 繰り返し/コピー/移動時の支払いステータス整理 | 🔜 後回し | → Phase 3 に統合（D-3: C案）                         |
| W3-05 収支: カスタムカテゴリ追加                   | ✅ 完了   | フルCRUD + 「未分類」振替 + インライン作成UI         |
| W3-06 アクティビティ削除時の通知設定               | ✅ 完了   | 3択ダイアログ + ACTIVITY_CANCELLED通知               |

---

## W3-02 お気に入り概念整理（クリップ/ブックマーク命名統一）

- **分類**: リファクタ
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **由来**: 積み残し #2
- **依存**: なし

### 設計判断
- **D-1: アイコン選定 → A案（Paperclip + Bookmark）** を採用
  - お知らせ: `Bookmark` → `Paperclip`（📎）に変更
  - コミュニティ: `Bookmark`（🔖）のまま維持
  - 視覚的に明確に区別でき、影響範囲最小

### 仕様
- **お知らせのブックマーク → 「クリップ」に統一**
  - DBテーブル名 `AnnouncementBookmark` は変更しない（破壊的変更を避ける）
  - UI上のラベルを「ブックマーク」→「📎 クリップ」に変更
  - アイコンを Bookmark → Paperclip（📎）に変更
- **コミュニティのブックマーク → 「ブックマーク」のまま維持**
  - `CommunityBookmark` テーブル・UIラベルともに変更なし
  - アイコンは ⭐ または 🔖 のまま

### 受入条件
- お知らせ一覧・詳細でブックマークアイコンがクリップアイコンに変わっていること
- お知らせの「ブックマーク」ラベルが「クリップ」に変わっていること
- コミュニティのブックマークは従来通り「ブックマーク」表記であること

### 関連ファイル（推定）
- `frontend/src/features/announcement/` — お知らせ関連コンポーネント
- `frontend/src/features/community/` — ブックマーク表示箇所

---

## W3-03 フリーテキスト最大文字数の棚卸し・統一

- **分類**: 改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API（DTOバリデーション）
- **由来**: 積み残し #12
- **依存**: なし

### 設計判断
- **D-2: 文字数上限 — BE既存値を基本維持、FEを合わせる方針**
  - Activity description: **500**（BE既存値を維持。拡張は要望があってから）
  - Announcement title: **100**（BE既存値を維持）
  - Announcement content: **10000**（BE既存値を維持。FEも10000に合わせる。既存データ保護）
  - User displayName: **50**（BE既存値を維持。海外名対応考慮）
  - 文字数カウンター: **長文フィールドのみ**（Activity description, Announcement content, User biography, Message content）

### 仕様
全フリーテキスト入力フィールドの maxLength を棚卸しし、BE（DTOバリデーション）とフロント（input maxLength / textarea maxLength / Zodスキーマ）を統一する。

### 対象フィールド（確定値）

| エンティティ        | フィールド  | 確定上限 | BE現状      | FE変更                   | カウンター |
| ------------------- | ----------- | -------- | ----------- | ------------------------ | ---------- |
| Community           | name        | 50       | 50          | maxLength追加            | —          |
| Community           | description | 500      | 500         | maxLength追加            | —          |
| Activity            | title       | 100      | 100         | Zod max(100) + maxLength | —          |
| Activity            | description | 500      | 500         | Zod max(500) + maxLength | ✅          |
| Announcement        | title       | 100      | 100         | maxLength追加            | —          |
| Announcement        | content     | 10000    | 10000       | maxLength追加            | ✅          |
| Message（チャット） | content     | 500      | 500         | maxLength追加            | ✅          |
| User                | displayName | 50       | 50          | maxLength追加            | —          |
| User                | biography   | 200      | 未定義→追加 | maxLength追加            | ✅          |
| Expense             | note        | 200      | 200         | 既存200確認のみ          | —          |

### 受入条件
- 全対象フィールドで BE バリデーション（ValueObject MAX_LENGTH）と フロント maxLength / Zod max が一致していること
- 上限超過時にBEで適切なエラーレスポンスが返ること
- 長文フィールド（Activity description, Announcement content, User biography, Message content）に文字数カウンターが表示されること

### 関連ファイル（推定）
- `backend/src/application/` — 各UseCaseのDTO定義
- `frontend/src/features/` — 各フォームコンポーネント

---

## W3-04 繰り返し/コピー/移動時の支払いステータス整理

> ⚠️ **Phase 3 に移送済み** — 詳細は phase3-progress.md 参照

- **分類**: 改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UseCase / Domain / DB
- **由来**: 積み残し #11
- **依存**: なし

### 設計判断
- **D-3: C案（Activity既存パターンに倣いデフォルト属性追加）→ Phase 3 に移送**
  - Activity に既にある `defaultStartTime`, `defaultEndTime`, `defaultLocation` と同じパターンで `defaultParticipationFee`, `defaultVisitorFee`, `defaultCapacity` を追加
  - DB変更を伴うため Phase 1 のスコープとしては重い → Phase 3 で実施
  - DnDによるコピー/移動UIは既に実装済み（`@dnd-kit/core` + 確認ダイアログ）
  - コピー時は既存APIの組み合わせ（`useCreateActivity` + `useCreateSchedule`）、移動時は `useUpdateSchedule` で日付変更 → Payment維持で問題なし
  - **Phase 3 での実施内容**: Prismaマイグレーション + `GenerateRecurringSchedulesUseCase` でデフォルト属性引き継ぎ + Activity作成/編集フォームにデフォルト値設定UI追加

---

## W3-05 収支: カスタムカテゴリCRUD

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain
- **由来**: wave2繰越
- **依存**: なし（ExpenseCategoryマスターテーブル + リポジトリは既存）

### 設計判断
- **D-4: UI形式 → C案（ドロップダウン末尾にインライン入力）** を採用
  - Select末尾に「＋ 新規作成」選択肢 → インラインテキスト入力 → 作成 → リスト更新 → 自動選択
  - 各カスタムカテゴリ項目に編集（ペンアイコン）・削除（×アイコン）のアクション付与
  - システムプリセットカテゴリは編集・削除ボタン非表示
- **カテゴリ削除時の支出振替**: 削除（論理削除）実行時に紐づく支出を「未分類」システムカテゴリに一括振替
  - `reassignCategory(fromId, toId)` リポジトリメソッドで SQL一括UPDATE（ドメインモデル非経由）
  - 理由: 振替先は固定の未分類カテゴリID。パフォーマンス優先。将来ルールが複雑化したらドメインサービス経由に昇格可能
  - 削除確認ダイアログで「このカテゴリの支出は『未分類』に振り替えられます」と表示

### 仕様
支出登録ダイアログのカテゴリ選択をフルCRUD対応にする。

| 操作     | 対象             | 動作                                                       |
| -------- | ---------------- | ---------------------------------------------------------- |
| **作成** | カスタムカテゴリ | Select末尾「＋ 新規作成」→ インライン入力 → 保存           |
| **編集** | カスタムカテゴリ | ペンアイコン → リネーム入力 → 保存                         |
| **削除** | カスタムカテゴリ | ×アイコン → 確認ダイアログ → 支出を未分類に振替 → 論理削除 |
| **参照** | 全カテゴリ       | 既存のSelectリスト表示                                     |

- システムプリセットカテゴリは作成・編集・削除不可
- 「未分類」システムカテゴリを正規化（マイグレーション or シードで固定ID投入）

### 受入条件
- Select末尾に「＋ 新規作成」選択肢があり、インライン入力でカテゴリ作成できること
- カスタムカテゴリに編集・削除アクションが表示されること
- システムカテゴリには編集・削除が表示されないこと
- カテゴリ削除時に紐づく支出が「未分類」に自動振替されること
- 作成/編集/削除後にSelectリストが即座に更新されること

### 関連ファイル（推定）
- `frontend/src/features/expense/pages/FinancePage.tsx`（CreateExpenseDialog内）
- `frontend/src/features/expense/api/expenseApi.ts`
- `backend/src/domains/expense/entities/ExpenseCategory.ts` — rename() 追加
- `backend/src/application/expense/usecase/` — Create/Update/Deactivate UseCase 新設
- `backend/src/api/front/expense/` — POST/PATCH/DELETE エンドポイント追加

---

## W3-06 アクティビティ削除時の通知設定

- **分類**: 改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **由来**: 積み残し #5
- **依存**: なし

### 設計判断
- **D-5: 通知レベル → A案（3択: お知らせ投稿 / プッシュのみ / 通知なし）** を採用
  - コミュニティ運営者にとって通知レベルの制御は重要
  - 実装コストは Enum + switch分岐程度。NotificationService の既存パターンを流用
- **D-6: 通知対象 → A案（アクティビティの参加者のみ）** を採用
  - 削除アクティビティに直接関係する参加者のみに通知。コミュニティ全体は過剰
  - Activity配下の全Scheduleから `findsByScheduleId` で参加者一覧を収集 → 重複排除
- **通知タイプ名**: `ACTIVITY_CANCELLED`（notificationCategories の activity 配列に追加）

### 仕様
アクティビティ削除の確認ダイアログに通知方法の選択肢を追加する。

| 選択肢                     | 動作                                                                |
| -------------------------- | ------------------------------------------------------------------- |
| **お知らせとして投稿する** | Announcement を作成（「○○が削除されました」）+ プッシュ通知         |
| **プッシュ通知のみ**       | Notification レコード作成 + プッシュ送信。Announcement は作成しない |
| **通知なし**               | 何もしない。サイレント削除                                          |

- デフォルト選択: 「プッシュ通知のみ」
- 通知対象: 該当アクティビティの参加者全員（Participation.userId）

### 受入条件
- 削除確認ダイアログに3つのラジオ選択肢が表示されること
- 「お知らせとして投稿」選択時、削除後にお知らせ一覧に投稿が表示されること
- 「プッシュ通知のみ」選択時、通知は届くがお知らせ一覧には投稿されないこと
- 「通知なし」選択時、削除のみ実行されること

### 関連ファイル（推定）
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — 削除ダイアログ
- `backend/src/application/activity/usecase/` — 削除UseCase
- `backend/src/application/announcement/usecase/` — お知らせ作成UseCase
- `backend/src/job/` — プッシュ通知送信

---

## 作業ログ
- 2026-03-16: Phase 1 作成。5件の小規模整理・改善を計画。
- 2026-03-17: 設計判断 D-1〜D-6 確定。W3-04 を Phase 3 に移送（D-3: C案）。W3-05 をフルCRUDに拡張。実装着手。
- 2026-03-18: W3-02（クリップ統一）, W3-03（文字数上限 — BE ValueObject + FE maxLength/CharacterCounter全10ファイル）, W3-05（カスタムカテゴリCRUD — BE 3UseCase + API 3 endpoint + FE フルUI）, W3-06（削除時通知3択 — BE SoftDeleteActivityUseCase拡張 + FE 3択ダイアログ）を全て実装完了。全TS ビルド通過。
