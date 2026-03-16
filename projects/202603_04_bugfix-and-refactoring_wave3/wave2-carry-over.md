# wave3以降送りバックログ

## 概要
以下の項目はwave2のスコープ外とし、wave3以降で対応する。

---

## wave3送り項目一覧

| #   | タイトル                                 | 分類     | 送り理由                                                                                                                 |
| --- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 25  | チャット: スレッド機能追加               | 新機能   | UI大規模新規実装。DB的にはMessage.parentMessageIdで自己参照が既にあるが、スレッドUIの設計・実装規模が大きい              |
| 54  | コミュニティ作成: ページ遷移制リファクタ | 新機能   | 3ページウィザード化＋詳細設定フォーム（年齢層・性別・レベル等）。Communityテーブルへのカラム追加多数、UIリファクタ規模大 |
| —   | コミュニティ検索: 詳細検索化             | 新機能   | #54と連動。作成画面の詳細設定項目と検索条件を揃える必要があり、単体では着手不可                                          |
| 56  | マイページ: プラン変更動線               | 新機能   | Stripe連携・サブスクリプション管理が関わり慎重な設計が必要。課金影響あり                                                 |
| —   | 収支機能: 収入タブ                       | 新機能   | Payment集計ベースの収入表示。wave2 Phase4で支出タブのみ実装、収入タブは後回し                                            |
| —   | 収支機能: 月別/年別フィルタ              | 機能拡張 | 支出・収入の月別/年別切り替え表示。現在は全期間一括表示のみ                                                              |
| —   | 収支機能: カスタムカテゴリ追加           | 機能拡張 | ExpenseCategoryマスターテーブルは実装済み。UI側のカスタムカテゴリ追加フォームが「準備中」状態                            |
| —   | ビジター: 一括支払い更新UI               | 機能拡張 | 管理者が全ビジターの支払い方法/状況を一括で設定するUI。個別更新APIは実装済み                                             |
| —   | ビジター: VisitorProfileテーブル追加     | 新機能   | ビジター固有情報（連絡先・メモ等）の管理。現在はvisitorName/addedByのみ                                                  |
| —   | ビジター: キャンセル待ち参加オプション   | 新機能   | ビジターのキャンセル待ち参加可否をアクティビティ作成時に設定。デフォルトNG                                               |

---

## #25 チャット: スレッド機能追加

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: Phase 3のチャット機能改善（#18〜#21）が完了していること
- **受入条件**:
  - メッセージに対してスレッド（返信）を作成できること
  - スレッドはメッセージ下部に「○件の返信」として表示され、クリックでスレッドビューが開くこと
  - スレッドビュー内で返信の送受信ができること
- **実装方針（概要）**:
  - DB: `Message.parentMessageId`（自己参照FK）は既に存在。追加のDB変更は不要
  - バックエンド: スレッド返信の作成API（parentMessageIdを指定）、スレッド取得API（parentMessageIdでフィルタ）
  - フロント: MessageBubbleにスレッドカウント表示、スレッドビュー画面（サイドパネルまたは新画面）の新規作成
- **規模見積**: L〜XL
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/`（新規: ThreadView等）
  - `frontend/src/features/chat/components/MessageBubble.tsx`
  - `backend/src/api/front/chat/`
  - `backend/src/application/`（chat関連）

---

## #54 コミュニティ作成: ページ遷移制リファクタ

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **依存**: なし
- **受入条件**:
  - 3ページのウィザード形式:
    - 1ページ目: 基本情報（名前・説明）
    - 2ページ目: 参加設定（公開/非公開、検索対象設定、参加方式）
    - 3ページ目: カテゴリ・タグ → 完了 or 詳細設定へ
  - 詳細設定:
    - 最大メンバー数、年齢層（範囲）、対象性別（指定なし・LGBTQ+含む）
    - 主な活動エリア、最寄駅
    - 活動頻度（週/月 × 回数）、活動曜日
    - 推奨レベル（0〜8の範囲スライダー + 「なし」オプション）
  - コミュニティタイプはUI上廃止（バックエンドでカテゴリから自動決定）
- **実装方針（概要）**:
  - DB変更: Communityテーブルへの新カラム追加
    - `targetAgeMin`, `targetAgeMax` (Int?)
    - `targetGender`の選択肢にLGBTQ+追加（enum拡張）
    - `recommendedLevelMin`, `recommendedLevelMax` (Int? 0-8)
    - `activityDayOfWeek`は既にCommunityActivityDayテーブルが存在
    - `isSearchable` (Boolean) — 非公開時の検索対象設定
  - フロント: CommunityCreatePageをマルチステップウィザードに全面リファクタ
  - コミュニティタイプ: カテゴリ→コミュニティタイプのマッピングをバックエンドのマスタデータで管理
- **規模見積**: XL
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityCreatePage.tsx`（全面書き換え）
  - `backend/prisma/schema.prisma`（Communityモデル拡張）
  - `backend/src/domains/community/`
  - `backend/src/application/community/`

---

## コミュニティ検索: 詳細検索化（番号なし）

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: #54（検索条件は作成画面の詳細設定項目と揃える必要あり）
- **受入条件**:
  - キーワード検索以外に詳細検索オプションがあること
  - カテゴリ、エリア、レベル等で絞り込みできること
- **規模見積**: L
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySearchPage.tsx`
  - `frontend/src/features/community/pages/CommunitySearchDetailPage.tsx`
  - `backend/src/api/front/community/`

---

## #56 マイページ: プラン変更動線

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain
- **依存**: なし
- **受入条件**:
  - マイページからプラン変更画面への動線があること
  - プラン変更が毎月1日に反映されること（即時変更ではない）
  - オーナーユーザのサブスクライバーがフリープランに変更する場合、コミュニティグレード低下のアラートが表示されること
- **実装方針（概要）**:
  - Stripe Billing連携でサブスクリプションの変更/キャンセルを実装
  - プラン変更予約（次回更新日に適用）のロジックをバックエンドに実装
  - コミュニティグレードへの影響チェックをドメインロジックで実装（CommunityGradePolicy）
- **規模見積**: XL（Stripe連携の影響範囲が広い）
- **関連ファイル（推定）**:
  - `frontend/src/features/user/pages/MyPage.tsx`
  - `frontend/src/features/billing/`
  - `backend/src/api/front/user/`
  - `backend/src/domains/community/domain/service/CommunityGradePolicy.ts`
  - `backend/src/integration/`（Stripe連携）

---

## wave3着手時の事前準備
1. #54のDB設計（Communityモデル拡張）を先に確定
2. #56のStripe連携フローを設計ドキュメントとして整理
3. #25のスレッドUIのデザインモックアップを用意

---

## 収支機能: 収入タブ（番号なし）

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: wave2 Phase4の収支機能（FinancePage）が完了していること
- **受入条件**:
  - FinancePageに「収入」タブが追加されていること
  - 参加費支払い済み（status=CONFIRMED）の合計が表示されること
  - 返金済み（REFUNDED）と返金不要（NO_REFUND）は計算に含めないこと
  - コミュニティ全体の累計収入が表示されること
- **実装方針（概要）**:
  - バックエンド: PaymentテーブルからCONFIRMEDのamount合計を集計するAPI
  - フロント: FinancePageに収入タブ追加、集計データを表示
- **規模見積**: M
- **関連ファイル（推定）**:
  - `frontend/src/features/expense/pages/FinancePage.tsx`
  - `backend/src/application/expense/usecase/GetFinanceSummaryUseCase.ts`

---

## 収支機能: 月別/年別フィルタ（番号なし）

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: 収入タブ実装後が望ましい
- **受入条件**:
  - 収支・収入・支出タブそれぞれで月別/年別の切り替えが可能であること
  - 月別: 指定月の集計結果が表示されること
  - 年別: 指定年の集計結果が表示されること
- **実装方針（概要）**:
  - バックエンド: 集計APIにfrom/toまたはyear/monthクエリパラメータを追加
  - フロント: タブ上部に月/年セレクターUIを追加
- **規模見積**: M
- **関連ファイル（推定）**:
  - `frontend/src/features/expense/pages/FinancePage.tsx`
  - `backend/src/application/expense/usecase/`

---

## 収支機能: カスタムカテゴリ追加（番号なし）

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: フロント（バックエンドAPIは実装済み）
- **変更レイヤー**: UI
- **依存**: なし（ExpenseCategoryマスターテーブル＋CRUD APIは既存）
- **受入条件**:
  - 支出登録ダイアログ内の「カスタムカテゴリ追加（準備中）」ボタンが有効化されること
  - ボタン押下でカテゴリ名入力→作成が可能であること
  - 作成したカテゴリが支出登録時のセレクトに即座に反映されること
- **実装方針（概要）**:
  - フロント: CreateExpenseDialog内のカテゴリ追加ボタンを有効化、インラインフォームまたはダイアログでカテゴリ名を入力→API呼び出し→セレクト更新
  - バックエンド: ExpenseCategory作成APIは既に存在する想定（なければ追加）
- **規模見積**: S
- **関連ファイル（推定）**:
  - `frontend/src/features/expense/pages/FinancePage.tsx`（CreateExpenseDialog内）
  - `frontend/src/features/expense/api/expenseApi.ts`

---

## ビジター: 一括支払い更新UI（番号なし）

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: wave2 Phase4のビジター支払い管理（個別更新）が完了していること
- **受入条件**:
  - 管理者がスケジュール参加者一覧で複数のビジターをチェックボックスで選択できること
  - 選択したビジター全員に対して支払い方法/支払いステータスを一括設定できること
- **実装方針（概要）**:
  - フロント: ActivityDetailPageの参加者テーブルにチェックボックス列追加、一括操作バー（支払い方法ドロップダウン + 適用ボタン）
  - バックエンド: 一括支払い更新API（participationId配列 + paymentMethod/status を受け取る）
- **規模見積**: M
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `backend/src/api/front/participation/`
  - `backend/src/application/participation/`

---

## ビジター: VisitorProfileテーブル追加（番号なし）

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **依存**: なし
- **受入条件**:
  - ビジター固有情報（連絡先メール、電話番号、メモ等）を登録・編集できること
  - ゲストビジター追加時にプロフィール情報を任意入力できること
  - 参加者一覧でビジターのプロフィール情報（連絡先等）を確認できること
- **実装方針（概要）**:
  - DB: `VisitorProfile`テーブル新設（visitorName, email?, phone?, memo?, communityId）
  - Participation.visitorNameはVisitorProfile.idへのFK化を検討
  - バックエンド: VisitorProfile CRUD API
  - フロント: ゲスト追加ダイアログにプロフィール入力欄追加、参加者一覧にプロフィール表示
- **規模見積**: L
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`
  - `backend/src/domains/`（新規: visitor/）
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`

---

## ビジター: キャンセル待ち参加オプション（番号なし）

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **依存**: なし
- **受入条件**:
  - アクティビティ作成/編集画面に「ビジターのキャンセル待ち参加を許可する」オプションがあること
  - デフォルトはOFF（NG）であること
  - OFFの場合、定員オーバー時にビジターはキャンセル待ちリストに入れないこと
  - ONの場合、ビジターも通常メンバーと同様にキャンセル待ちリストに入れること
- **実装方針（概要）**:
  - DB: `Activity`テーブルに`allowVisitorWaitlist` (Boolean, default: false) カラム追加
  - バックエンド: アクティビティ作成/更新APIで`allowVisitorWaitlist`を受け付け、キャンセル待ち登録時にビジター可否をチェック
  - フロント: ActivityFormに「ビジターのキャンセル待ち参加を許可する」チェックボックス追加
- **規模見積**: M
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（Activityモデル）
  - `backend/src/application/participation/`（WaitlistEntry登録ロジック）
  - `frontend/src/features/activity/components/ActivityForm.tsx`
