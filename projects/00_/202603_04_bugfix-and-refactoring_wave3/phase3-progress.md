# Phase 3 — 収支・ビジター機能拡張

> **最終更新**: 2026-03-18
> **ステータス**: ✅ Phase 3 完了

## フェーズ概要
- **ゴール**: 収支機能の機能完成（収入タブ + フィルタ）、ビジター機能の拡張（登録済みビジター追加 + 未登録サジェスト + キャンセル待ちオプション）、繰り返し生成デフォルト属性
- **対象**: W3-11, W3-12, W3-04, W3-13a, W3-13b, W3-14
- **変更対象レイヤー**: UI / API / UseCase / Domain / DB
- **規模**: L（6件。DB変更2件を含む）

## タスク一覧

| タスク                                              | 状態   | 備考                                                                                              |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| W3-04 繰り返し生成時のデフォルト属性引き継ぎ        | ✅ 完了 | Activity に4カラム追加。D-4:A（暗黙同期+別編集）方式                                              |
| W3-11 収支: 収入タブ（Payment集計）                 | ✅ 完了 | D-1:B別UseCase、D-2:Cサマリータブ廃止→支出/収入2タブ。支出タブにサマリーカード内包                |
| W3-12 収支: 月別フィルタ                            | ✅ 完了 | 全期間/月別 セレクタ。支出はexpenseDate、収入はschedule.dateでフィルタ (D-3:A)                    |
| W3-13a ビジター: 登録済みビジター追加 UseCase / API | ✅ 完了 | AddRegisteredVisitorUseCase + POST /v1/schedules/:id/registered-visitors。D-5:A料金フォールバック |
| W3-13b ビジター: 未登録ビジターサジェスト           | ✅ 完了 | SuggestVisitorNamesUseCase + オートコンプリートUI                                                 |
| W3-14 ビジター: キャンセル待ち参加オプション        | ✅ 完了 | allowVisitorWaitlist カラム + WaitlistEntry.isVisitor + 繰り上げ時のビジター料金対応              |

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

| 集計項目 | 算出方法                                              |
| -------- | ----------------------------------------------------- |
| 収入合計 | Payment WHERE status = CONFIRMED の amount 合計       |
| 除外     | REFUNDED（返金済み）、NO_REFUND（返金不要）は含めない |
| 表示粒度 | コミュニティ全体の累計 + アクティビティ別の内訳       |

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

| フィルタモード           | 動作                                 |
| ------------------------ | ------------------------------------ |
| **全期間**（デフォルト） | 現行通り全件集計                     |
| **月別**                 | 月セレクターで指定月の集計結果を表示 |
| **年別**                 | 年セレクターで指定年の集計結果を表示 |

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

## W3-04 繰り返し生成時のデフォルト属性引き継ぎ（Phase 1 から移送）

- **分類**: 改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UseCase / Domain / DB
- **由来**: 積み残し #11 → Phase 1 W3-04 から移送
- **依存**: なし

### 設計判断（Phase 1 で確定済み）
- **D-3: C案（Activity既存パターンに倣いデフォルト属性追加）**
  - Activity に既にある `defaultStartTime`, `defaultEndTime`, `defaultLocation` と同じパターン
  - `defaultParticipationFee`, `defaultVisitorFee`, `defaultCapacity` を追加
  - DnDによるコピー/移動UIは実装済み。移動時はPayment維持で問題なし

### 仕様

#### DBスキーマ変更
Activity テーブルに以下カラムを追加:
- `defaultParticipationFee Int? @default(0)` — デフォルト参加費
- `defaultVisitorFee Int? @default(0)` — デフォルトビジター費
- `defaultCapacity Int?` — デフォルト定員

#### ロジック変更
- `GenerateRecurringSchedulesUseCase`: スケジュール生成時に Activity のデフォルト属性を引き継ぎ
- Activity 作成/編集フォーム: デフォルト値設定UIを追加

### 受入条件
- 繰り返し生成されたスケジュールに Activity のデフォルト参加費・ビジター費・定員が引き継がれること
- Activity 作成/編集フォームでデフォルト値を設定できること
- DnDコピー/移動は既存動作を維持すること

### 関連ファイル
- `backend/prisma/schema.prisma` — Activity モデルにカラム追加
- `backend/src/application/activity/usecase/GenerateRecurringSchedulesUseCase.ts`
- `frontend/src/features/activity/components/ActivityForm.tsx`

---

## W3-13a ビジター: 登録済みビジター追加 UseCase / API

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: バックエンドのみ（UIは本Phaseスコープ外）
- **変更レイヤー**: API / UseCase
- **由来**: wave2繰越（レビュー[36][37]）
- **依存**: なし（DB・ドメインモデルは対応済み）

### 設計判断（Phase 3 で確定）
- **VisitorProfile テーブルは新設しない**
- ビジターは2種類:
  - **未登録ビジター**: `Participation` の `isVisitor=true` + `userId=null` + `visitorName` で管理（**実装済み**）
  - **登録済みビジター**: `Participation` の `isVisitor=true` + `userId=対象UserのID` で管理（**UseCase/API未実装**）
- 既存の `Participation` ドメインモデルは `isRegisteredVisitor()` / `isUnregisteredVisitor()` 判定メソッドを持ち、`Participation.create()` に `isVisitor=true` + `userId` を渡すだけで登録済みビジターが作成できる
- **登録済みビジターのUI動線は、公開アクティビティ検索機能（→ CF-1）が前提**のため、UI実装は後続に委ねる

### 仕様

#### AddRegisteredVisitorUseCase（新設）
- 入力: `scheduleId`, `userId`（対象ユーザー）, `addedBy`（操作者）
- バリデーション:
  1. スケジュール存在チェック
  2. キャンセル済みチェック
  3. 対象 User の存在確認
  4. 対象 User がコミュニティメンバーでないことの確認（メンバーなら通常参加を案内）
  5. 同一スケジュールへの重複参加チェック
  6. 定員チェック（満員時は W3-14 の `allowVisitorWaitlist` に従う）
- 処理:
  1. `Participation.create({ isVisitor: true, userId, addedBy })` でドメインオブジェクト作成
  2. ビジター料金の Payment レコード作成（`visitorFee` が設定されていればそれを使用、なければ `participationFee`）
  3. トランザクション内で保存

#### APIエンドポイント（新設）
- `POST /v1/schedules/:scheduleId/registered-visitors`
- リクエストボディ: `{ userId: string }`
- 認証: 管理者以上

### 受入条件
- 登録済みユーザーをビジターとしてスケジュールに追加できること
- コミュニティメンバーを登録済みビジターとして追加しようとするとエラーになること
- 重複参加がエラーになること
- Payment レコードが適切な料金で作成されること
- 定員オーバー時は W3-14 のルールに従うこと

### 関連ファイル
- `backend/src/application/participation/usecase/` — AddRegisteredVisitorUseCase（新設）
- `backend/src/api/front/schedule/` — APIエンドポイント追加
- `backend/src/domains/participation/` — ドメインモデル（変更不要。既に対応済み）

---

## W3-13b ビジター: 未登録ビジターサジェスト

- **分類**: 機能改善
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **由来**: wave2繰越（レビュー[36]）
- **依存**: なし

### 仕様
ゲストビジター追加ダイアログで、同一コミュニティ内の過去に登録した未登録ビジターの `visitorName` をサジェスト表示する。

#### SuggestVisitorNamesUseCase（新設）
- 入力: `communityId`
- 処理: `Participation` テーブルから `isVisitor=true` かつ `userId=null` の `visitorName` を `DISTINCT` で取得
- 出力: `string[]`（ビジター名リスト）

#### APIエンドポイント（新設）
- `GET /v1/communities/:communityId/visitor-name-suggestions`
- レスポンス: `{ visitorNames: string[] }`

#### フロントエンド
- ゲストビジター追加ダイアログの名前入力欄をオートコンプリート対応
- 入力中にAPIからの候補リストで絞り込み表示

### 受入条件
- ゲストビジター追加時に過去の未登録ビジター名がサジェストされること
- サジェストから選択して素早くビジターを追加できること
- 新しい名前の手入力も引き続き可能であること

### 関連ファイル（推定）
- `backend/src/application/participation/usecase/` — SuggestVisitorNamesUseCase（新設）
- `backend/src/api/front/community/` — APIエンドポイント追加
- `frontend/src/features/activity/pages/ActivityDetailPage.tsx` — ゲスト追加ダイアログにオートコンプリート追加

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

| 設定                  | 動作                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| **OFF**（デフォルト） | 定員オーバー時、ビジターはキャンセル待ちリストに入れない。「定員に達しています」エラー |
| **ON**                | ビジターも通常メンバーと同様にキャンセル待ちリストに登録可能                           |

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
- 2026-03-17: W3-04（繰り返し生成時のデフォルト属性引き継ぎ）を Phase 1 から移送・統合。D-3: C案確定。
- 2026-03-17: **設計判断: VisitorProfile テーブル新設を廃止**。理由: 未登録ビジターは既存の `Participation.visitorName` で十分、登録済みビジターは `Participation.userId` で User テーブルに紐付ければよい。W3-13 を W3-13a（登録済みビジター追加 UseCase/API）+ W3-13b（未登録ビジターサジェスト）に分割。登録済みビジターのUI動線は公開アクティビティ検索機能（CF-1）が前提のため、本Phaseでは UseCase/API のみ実装。
- 2026-03-18: Phase 3 全6件実装完了。
  - Step 0: DBマイグレーション（Activity に4カラム追加: defaultParticipationFee, defaultVisitorFee, defaultCapacity, allowVisitorWaitlist）
  - Step 1: W3-04 デフォルト属性引き継ぎ（Activity CRUD + GenerateRecurringSchedules + フロントUI）
  - Step 2: W3-14 ビジターキャンセル待ち（WaitlistEntry.isVisitor + allowVisitorWaitlistチェック + 繰り上げ時ビジター料金）
  - Step 3: W3-13a 登録済みビジター追加（AddRegisteredVisitorUseCase + API + フロントAPI）
  - Step 4: W3-13b ビジター名サジェスト（SuggestVisitorNamesUseCase + API + オートコンプリートUI）
  - Step 5: W3-11 収入タブ（GetCommunityIncomeUseCase + FinancePage 2タブ再構築: 支出/収入）
  - Step 6: W3-12 期間フィルタ（from/toクエリパラメータ + 月別セレクタUI）
- 2026-07-06: Phase 3 追加修正（3件）
  - [1] FinancePage 凸型レイアウト: 収入/支出サマリーをタブ上部に横並び表示。各タブ内の総額カードを削除
  - [2] ビジター waitlist 3点修正:
    - (a) AddGuestVisitorUseCase: 定員超過時に allowVisitorWaitlist=true ならキャンセル待ちに追加
    - (b) ActivityForm: allowVisitorWaitlist チェックボックスを isEditMode 外に移動（作成フォームでも表示）
    - (c) ActivityForm: デフォルト設定セクション（details）を削除
    - (d) ActivityCreatePage: handleSubmit に allowVisitorWaitlist を追加
  - [3] 繰り返しスケジュール生成のリアーキテクチャ:
    - Worker（startRecurrenceWorker.ts）廃止 → creation-time バルク生成
    - DDD Domain Service `RecurringScheduleGenerator` 新設（static method パターン）
    - CreateActivityUseCase: 作成時に 1 年/最大 365 件のスケジュールをバルク生成
    - UpdateActivityUseCase: recurrenceRule 変更時に差分管理（物理削除 or 論理キャンセル + 再生成）
    - IScheduleRepository: saveMany / deleteMany 追加
    - IParticipationRepository / IWaitlistEntryRepository: countByScheduleIds 追加
    - GenerateRecurringSchedulesUseCase: ドメインサービスに委譲するようリファクタ
    - ActivityDetailPage: schedules.length > 1 条件を削除（繰り返しナビを 1 件でも表示）
    - 設計ドキュメント: backend/docs/recurrence/README.md 新設
    - シードデータ: recurrenceRule + defaults + 複数スケジュール追加
- 2026-03-18: Phase 3 追加修正（2件）
  - [1] 収入集計SQL修正: aggregateConfirmedIncomeByActivity の JOIN を `Payment→Participation→Schedule` から `Payment.scheduleId→Schedule` 直接JOINに変更。Participation 物理削除済みの CONFIRMED Payment も全期間集計に含まれるようになった
  - [2] Payment displayName スナップショットカラム追加 + ビジター返金フロー対応:
    - Payment テーブルに `displayName` (VARCHAR 100) カラム追加。支払い時点の表示名を保存（登録ユーザー=User.displayName, ビジター=visitorName）
    - Payment.create の全4箇所で displayName を設定: AttendScheduleUseCase, AddRegisteredVisitorUseCase, AddGuestVisitorUseCase, CreatePaymentOnWaitlistPromoted
    - WaitlistPromotedEvent に displayName フィールド追加、3つのプロモーション呼び出し元から伝播
    - RemoveParticipantByAdminUseCase / RemoveParticipationUseCase: ビジター（userId=null）の場合も participationId 経由で Payment を取得し、CONFIRMED/REPORTED → REFUND_PENDING に遷移
    - ListRefundPendingPaymentsUseCase / ListPaymentHistoryUseCase: `payment.displayName ?? userMap.get(userId)` のフォールバック表示
    - Prisma マイグレーション + 既存データのバックフィル（User.displayName / Participation.visitorName → Payment.displayName）
- 2026-03-18: 収入タブ スケジュール別展開機能（Activity クリック → Schedule 別 → 個別支払い詳細）
  - 設計方針: Activity 別合計は既存の aggregateConfirmedIncomeByActivity を継続使用。詳細はクリック時に新エンドポイントから遅延取得（lazy fetch）
  - isVisitor は Payment カラム追加せず、Participation INNER JOIN で取得（CONFIRMED な Payment は必ず生きた Participation を持つ）
  - IPaymentRepository: getConfirmedPaymentsByActivity メソッド追加（CONFIRMED 個別レコードを Schedule 別に返す raw SQL）
  - GetActivityIncomeDetailUseCase 新設: フラット行を Schedule → Payment[] のネスト構造に整形。Schedule ラベル = date + startTime
  - API: GET /v1/communities/:communityId/finance/income/activities/:activityId?from=&to= 追加
  - Frontend 型: ActivityIncomeDetailResponse 追加、expenseApi.activityIncomeDetail 追加
  - React Query: useActivityIncomeDetail hook 追加（enabled で遅延制御）
  - IncomeTab UI: `<details>/<summary>` アコーディオン化。Activity 行展開で spinner → Schedule 一覧 → 個別支払い（displayName + 金額）表示
  - ビジター表示: isVisitor && userId != null → "（ビジター）"、userId == null → "（ビジター・ゲスト）"
