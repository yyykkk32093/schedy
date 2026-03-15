# Phase 5 — wave3以降送りバックログ

## 概要
以下の項目はwave2のスコープ外とし、wave3以降で対応する。

---

## wave3送り項目一覧

| #   | タイトル                                 | 分類   | 送り理由                                                                                                                 |
| --- | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 25  | チャット: スレッド機能追加               | 新機能 | UI大規模新規実装。DB的にはMessage.parentMessageIdで自己参照が既にあるが、スレッドUIの設計・実装規模が大きい              |
| 54  | コミュニティ作成: ページ遷移制リファクタ | 新機能 | 3ページウィザード化＋詳細設定フォーム（年齢層・性別・レベル等）。Communityテーブルへのカラム追加多数、UIリファクタ規模大 |
| —   | コミュニティ検索: 詳細検索化             | 新機能 | #54と連動。作成画面の詳細設定項目と検索条件を揃える必要があり、単体では着手不可                                          |
| 56  | マイページ: プラン変更動線               | 新機能 | Stripe連携・サブスクリプション管理が関わり慎重な設計が必要。課金影響あり                                                 |

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
