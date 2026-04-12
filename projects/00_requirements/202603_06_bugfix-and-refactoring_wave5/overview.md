# Wave5 — Wave4レビュー指摘対応 + モバイル依存・要件定義未了タスク

> **最終更新**: 2026-04-12
> **ステータス**: 🚧 作業中

## 概要

Wave5 は以下の3カテゴリのタスクで構成される。

1. **W5-10（完了）**: コミュニティ作成改革（DB〜UI一括改善）
2. **W5-2x（新規）**: Wave4 実装後の横断レビュー指摘（wave4-carry-over.md 由来）
3. **W5-01/02（後送り）**: モバイル依存 or 要件定義未了のため引き続き保留

---

## タスク一覧

### 完了タスク

| #   | ID    | タイトル                                               | 規模 | ステータス | 由来       |
| --- | ----- | ------------------------------------------------------ | ---- | ---------- | ---------- |
| 1   | W5-10 | コミュニティ作成改革（DB・バックエンド・フロント一括） | L    | ✅ 完了     | wave5 新規 |

### Wave4 レビュー指摘（wave4-carry-over.md 統合）

| #   | ID    | タイトル                                                    | 規模 | ステータス | 変更レイヤー                | 設計判断 | carry-over # |
| --- | ----- | ----------------------------------------------------------- | ---- | ---------- | --------------------------- | -------- | ------------ |
| 2   | W5-21 | コミュニティ作成画面 — UI修正・機能追加                     | M    | ❌ 未着手   | UI                          | —        | [1]-[6]      |
| 3   | W5-22 | コミュニティ設定画面 — カテゴリ変更対応                     | S    | ❌ 未着手   | UI                          | —        | [7]          |
| 4   | W5-23 | コミュニティ設定画面 — Stripe設定動線                       | M    | ❌ 未着手   | UI / API（要設計）          | 🔍 要     | [8]          |
| 5   | W5-24 | コミュニティ詳細画面 — カバー画像デフォルト＋ツリーボタン   | M    | ❌ 未着手   | UI / アセット               | —        | [9][10]      |
| 6   | W5-25 | チャット — コミュニティカテゴリのツリー形式表示             | L    | ❌ 未着手   | UI（要設計）                | 🔍 要     | [11]         |
| 7   | W5-26 | アクティビティ画面 — 作成/更新後ブラウザバック修正          | S    | ❌ 未着手   | UI（ナビゲーション）        | —        | [12][13]     |
| 8   | W5-27 | アクティビティ詳細 — キャンセル済みアクティビティ表示       | M    | ❌ 未着手   | UI / API / Domain（要設計） | 🔍 要     | [14]         |
| 9   | W5-28 | プラン改革 — Lifetime表示期間制御 + Subscriber→Lite/Pro分割 | XL   | ❌ 未着手   | DB / Domain / API / UI      | 🔍 要     | [15][16]     |

### 保留タスク（モバイル依存・要件定義未了）

| #   | ID    | タイトル                                                      | 規模 | ステータス | 依存     | 事前準備                        | 由来        |
| --- | ----- | ------------------------------------------------------------- | ---- | ---------- | -------- | ------------------------------- | ----------- |
| 10  | W5-01 | 広告機能（サブスクライバー/プレミアム非表示）                 | XL   | ❌ 未着手   | モバイル | 広告SDK選定、モバイル案件と連携 | wave4 W4-04 |
| 11  | W5-02 | 便利機能（乱数表・組み合わせ・得点記録・トーナメント/リーグ） | XL   | ❌ 未着手   | なし     | 要件定義から着手                | wave4 W4-06 |

---

## W5-10 コミュニティ作成改革

- **分類**: リファクタリング + UX改善
- **優先度**: P1
- **変更対象**: 両方（バックエンド + フロントエンド）
- **変更レイヤー**: DB / Domain / UseCase / API / UI
- **ステータス**: ✅ 完了

### 変更内容

1. **DB（Prisma）**
   - Community: `ageRange String?` → `ageMin Int?` / `ageMax Int?` に分離
   - Community: `categoryId String?` 追加（FK → CategoryMaster）
   - Community: `recommendedLevelMin Int?` / `recommendedLevelMax Int?` 追加
   - CategoryMaster: `communityTypeId String?` FK 追加（カテゴリ→タイプ自動解決）
   - ParticipationLevelMaster: 9段階（pl-0〜pl-8）に更新
   - マイグレーション: `20260323052054_wave5_community_creation_reform`

2. **バックエンド**
   - `communitySchemas.ts`: communityTypeId/categoryIds/participationLevelIds/ageRange 削除 → ageMin/ageMax/categoryId/recommendedLevelMin/Max 追加
   - `Community.ts`: Entity 全メソッド更新（create, createChild, reconstruct, update, getters）
   - `CommunityRepositoryImpl.ts`: save/toDomain/findDetailById/searchPublic/findPublicDetailById 更新
   - `ICommunityRepository.ts`: CommunityDetail/PublicCommunitySearchItem 型更新
   - `communityController.ts`: リクエストbody更新
   - `CreateCommunityUseCase.ts`: category→type自動解決ロジック追加、participationLevelIds処理削除

3. **フロントエンド**
   - `api.ts`: CreateCommunityRequest/CommunityDetail/PublicCommunitySearchItem 型更新
   - `CommunityCreatePage.tsx`:
     - Step1: communityType Select 削除（category→type で自動解決）
     - Step2: ageRange テキスト入力 → ageMin/ageMax Select、participationLevels ボタン複数選択 → Slider レンジ（0〜8）
     - Step3: カテゴリ複数選択 → 単一選択、確認プレビュー拡充
   - `CommunitySearchPage.tsx` / `CommunitySearchDetailPage.tsx`: ageRange 表示 → ageMin/ageMax 表示
   - shadcn/ui Slider コンポーネント導入

4. **シードデータ**
   - e2e-seed-data.sql: 新カラム対応 + CommunityParticipationLevel INSERT 削除

### 持ち越し / 今後の対応

- ~~UpdateCommunityUseCase / CommunitySettingsPage への新フィールド反映~~ → ✅ Phase 1.5 で完了
- ~~AgeRange VO ファイル削除~~ → ✅ Phase 1.5 で完了
- ~~activityFrequency の2段階ドロップダウン化~~ → ✅ Phase 1.5 で完了
- ~~サブコミュニティカルーセル~~ → ✅ Phase 1.5 で完了
- ~~プラン変更フロー導線~~ → ✅ Phase 1.5 で完了

---

## W5-21 コミュニティ作成画面 — UI修正・機能追加

- **分類**: バグ修正 + UX改善
- **優先度**: P1
- **変更対象**: フロントエンド（一部バックエンド）
- **変更レイヤー**: UI
- **由来**: wave4 carry-over [1]-[6]

### 対応項目

| #   | 内容                                          | 分類     |
| --- | --------------------------------------------- | -------- |
| [1] | 作成後ブラウザバック → コミュニティ一覧に遷移 | ナビ修正 |
| [2] | Step2 活動頻度「指定なし」の見切れ修正        | UI修正   |
| [3] | 活動拠点入力追加（設定画面と同じ入力方法）    | 機能追加 |
| [4] | 対象年齢プルダウン仕様変更                    | UX改善   |
| [5] | 年齢上限/下限の選択肢連動ロジック             | UX改善   |
| [6] | 推奨レベルに「指定なし」追加 + カテゴリ必須化 | UX改善   |

### 実装メモ
- [1]: `history.replaceState` or `navigate(..., { replace: true })` で作成完了後にヒストリスタックを置換
- [3]: CommunitySettingsPage の活動拠点入力UIを確認し、同じパターンで CommunityCreatePage に追加
- [5]: 年齢 Select の `options` を他方の選択値に応じて動的にフィルタリング

---

## W5-22 コミュニティ設定画面 — カテゴリ変更対応

- **分類**: 機能追加
- **優先度**: P2
- **変更対象**: フロントエンド
- **変更レイヤー**: UI
- **由来**: wave4 carry-over [7]

### 対応内容
- CommunitySettingsPage でカテゴリの変更を可能にする
- 配置: タグの変更入力エリアの**上に**カテゴリ Select を追加
- UpdateCommunityUseCase は W5-10 Phase 1.5 で categoryId 対応済み → フロント側のみ

---

## W5-23 コミュニティ設定画面 — Stripe設定動線

- **分類**: 機能追加
- **優先度**: P2
- **変更対象**: フロントエンド + バックエンド（要設計）
- **変更レイヤー**: UI / API
- **由来**: wave4 carry-over [8]

### 🔍 設計判断ポイント

1. **Stripe Connect vs Stripe Checkout**: コミュニティ単位の決済をどう実現するか
   - Connect: 各コミュニティオーナーがStripeアカウントを持つ（マーケットプレイスモデル）
   - Checkout: プラットフォームが一括で決済し、分配する
2. **設定画面に何を表示するか**: Stripe ダッシュボードへのリンク? アプリ内での銀行口座設定?
3. **前提**: ユーザーの Plan との関係（Pro のみ? Lite でも可?）

### 着手条件
- [ ] Stripe 連携方針の設計ドキュメントが作成されていること

---

## W5-24 コミュニティ詳細画面 — カバー画像デフォルト＋ツリーボタン

- **分類**: UX改善
- **優先度**: P2
- **変更対象**: フロントエンド（一部バックエンド）
- **変更レイヤー**: UI / アセット
- **由来**: wave4 carry-over [9][10]

### 対応項目

| #    | 内容                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| [9]  | カバー画像デフォルト: フリー素材の風景画を10種用意しランダム設定              |
| [10] | 設定ボタン右横にコミュニティツリーボタン追加（→ `/communities/:id/sub/tree`） |

### 実装メモ
- [9]: コミュニティID or 作成日時のハッシュで決定論的にランダム選択（再表示時に変わらないように）
- [9]: 画像アセットは `frontend/public/images/default-covers/` に配置 or S3
- [10]: SubCommunityTreePage は Phase 1.5 で作成済み → ボタン追加のみ

---

## W5-25 チャット — コミュニティカテゴリのツリー形式表示

- **分類**: 機能追加
- **優先度**: P2
- **変更対象**: フロントエンド（一部バックエンド）
- **変更レイヤー**: UI
- **由来**: wave4 carry-over [11]

### 🔍 設計判断ポイント

1. **ツリー構造のデータ取得**: 既存の `findChildrenWithDetails` API で親子関係を取得可能か、チャット用に別エンドポイントが必要か
2. **ツリーUI**: コミュニティ一覧画面と同じツリーコンポーネントを再利用するか
3. **チャットルームの階層**: 親コミュニティのチャットに子コミュニティのメッセージも表示するのか、それとも個別ルームを展開表示するだけか

---

## W5-26 アクティビティ画面 — 作成/更新後ブラウザバック修正

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロントエンド
- **変更レイヤー**: UI（ナビゲーション）
- **由来**: wave4 carry-over [12][13]

### 対応内容
- [12]: アクティビティ**作成後**に詳細画面でブラウザバック → 作成画面ではなく**コミュニティ詳細のアクティビティタブ**に遷移
- [13]: アクティビティ**更新後**に詳細画面でブラウザバック → 更新画面ではなく**コミュニティ詳細のアクティビティタブ**に遷移
- W5-21 [1] と同じパターン（`navigate(..., { replace: true })`）で対応可能

---

## W5-27 アクティビティ詳細 — キャンセル済みアクティビティ表示

- **分類**: 機能追加 + バグ修正
- **優先度**: P2
- **変更対象**: フロントエンド + バックエンド
- **変更レイヤー**: UI / API / Domain
- **由来**: wave4 carry-over [14]

### 🔍 設計判断ポイント

1. **現状の削除動作の確認**: アクティビティ詳細画面から削除したとき、何が起きるか?
   - Schedule が論理削除される?
   - Activity レコード自体は残る?
   - 関連する Announcement / Notification のリンクはどうなる?
2. **「キャンセル済み」の定義**: `deletedAt` が設定されている = キャンセル? 別途 `status` カラムが必要?
3. **API の振る舞い**: 削除済みアクティビティへの GET リクエストで 404 を返すか、ステータス付きで 200 を返すか
4. **表示仕様**: 「このアクティビティはキャンセルされました」メッセージ + 最低限の情報（タイトル、日時）を表示?

---

## W5-28 プラン改革 — Lifetime表示期間制御 + Subscriber→Lite/Pro分割

- **分類**: 機能追加（大規模）
- **優先度**: P2
- **変更対象**: 両方（バックエンド + フロントエンド）
- **変更レイヤー**: DB / Domain / UseCase / API / UI
- **由来**: wave4 carry-over [15][16]

### 🔍 設計判断ポイント

#### [15] Lifetime プラン表示期間制御
1. **DB設計**: `PlanMaster` テーブルに `availableFrom` / `availableTo` カラム追加? or 別テーブル `PlanAvailabilityPeriod` で期間管理?
2. **表示制御ロジック**: フロントで判定 or APIで非表示プランをフィルタリング?
3. **既存 Lifetime 購入者への影響**: 表示非表示は購入画面のみ? ユーザーの現プラン表示には影響なし?

#### [16] Subscriber → Lite / Pro 分割
1. **DB変更**: `Plan` enum 変更（`SUBSCRIBER` → `SUBSCRIBER_LITE` / `SUBSCRIBER_PRO`）or マスタテーブル化?
2. **既存ユーザーのマイグレーション**: 現在の SUBSCRIBER ユーザーは Pro に自動移行?
3. **Stripe 連携**: 新プランの Price ID 作成、既存サブスクリプションの切り替え
4. **機能制限マトリクス**: Lite / Pro で何が違うのか（コミュニティ作成数? メンバー数上限? etc.）
5. **プラン名称**: UI上の表示名を確定する必要あり

### 着手条件
- [ ] プラン体系の設計ドキュメント（Lite/Pro の機能差・価格差の定義）
- [ ] Stripe ダッシュボードでの新プラン Price 作成
- [ ] 既存 SUBSCRIBER ユーザーのマイグレーション方針決定

---

## W5-01 広告機能（旧 W4-04）— 保留

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **由来**: wave4 W4-04（積み残し #1）
- **依存**: モバイルアプリの進捗
- **事前準備**: 広告SDK選定、モバイル案件と連携

### 仕様
- 広告SDK選定（Google AdMob / AdSense）
- Web版（Vite SPA）とモバイル（LIFF / ネイティブ）で異なるSDKが必要
- サブスクライバー以上のプランでは広告非表示

### 受入条件
- FREE プランユーザーに広告が表示されること
- SUBSCRIBER / PREMIUM プランユーザーには広告が表示されないこと

### 着手条件
- [ ] モバイルアプリ（LIFF or ネイティブ）の基本実装が完了していること
- [ ] 広告SDKの選定が完了していること

---

## W5-02 便利機能（旧 W4-06）— 保留

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave4 W4-06（積み残し #7）
- **依存**: なし
- **事前準備**: 要件定義から着手

### 仕様
- 乱数表・メンバー組み合わせ・得点記録・トーナメント/リーグ作成
- 独立ドメインとして設計が必要
- IdeaBox候補として優先度を検討

### 受入条件
- 要件定義完了後に確定

### 着手条件
- [ ] 要件定義ドキュメントが作成されていること
- [ ] ER図・ドメインモデル設計が完了していること

---

## 作業ログ
- 2026-03-22: Wave5 overview 作成。Wave4 Phase 5+ トリアージにて W4-04（広告）/ W4-06（便利機能）をモバイル依存・要件定義未了として wave5 に移管。
- 2026-07-23: W5-10 コミュニティ作成改革を実装完了。DB: ageRange→ageMin/ageMax分離、categoryId直接FK、recommendedLevelMin/Max、ParticipationLevelMaster 9段階化。バックエンド: Entity/Repository/UseCase/Controller/Schema一括更新、category→type自動解決。フロントエンド: ウィザード全Step改修（communityType削除、Sliderレンジ、ageMin/ageMax Select、category単一選択）、検索ページageMin/ageMax表示対応。
- 2026-07-24: Phase 1.5（持ち越しタスク解消 + 新機能）実装完了。[1] Step2 Select空文字バグ修正、[2] サブコミュニティカルーセル（Backend API + Frontend）、[3] プラン変更フロー導線、[4] UpdateCommunityUseCase/CommunitySettingsPage新フィールド、AgeRange VO削除、activityFrequency 2段階ドロップダウン。TSコンパイルエラー0件。
- 2026-07-24: Phase 1.5 レビュー対応。
  - (1) プラン導線をActionBarからMyPageに移動（プランはユーザー紐づきのため）
  - (2) サブコミュニティカルーセルをshadcn/Emblaベースに全面書換（1枚表示+ドット+循環、ActionBar右端配置）
  - (3) CreateSubCommunityPage/SubCommunityListPage/SubCommunityTreePage新規作成 + ルート登録
  - CommunitySettingsPageアップグレードリンク削除（community gradeとuser planの混同回避）
  - TSコンパイルエラー0件確認
- 2026-04-12: wave4-carry-over.md（レビュー指摘16項目）を overview.md に統合。W5-21〜W5-28 として分類・ID採番。設計判断ポイント（W5-23 Stripe / W5-25 チャットツリー / W5-27 キャンセル済み表示 / W5-28 プラン改革）を明記。
