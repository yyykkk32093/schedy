# Wave5 — モバイル依存・要件定義未了タスク + コミュニティ作成改革

> **最終更新**: 2026-07-24
> **ステータス**: 🚧 作業中

## 概要

Wave4 Phase 5+ のトリアージにおいて、**モバイル依存** または **要件定義未了** のため Wave4 スコープから分離したタスク群。
加えて、Wave4 完了後に判明したコミュニティ作成フローの改善を含む。

---

## タスク一覧

| #   | ID    | タイトル                                                      | 規模 | ステータス | 依存     | 事前準備                        | 由来        |
| --- | ----- | ------------------------------------------------------------- | ---- | ---------- | -------- | ------------------------------- | ----------- |
| 1   | W5-10 | コミュニティ作成改革（DB・バックエンド・フロント一括）        | L    | ✅ 完了     | なし     | —                               | wave5 新規  |
| 2   | W5-01 | 広告機能（サブスクライバー/プレミアム非表示）                 | XL   | ❌ 未着手   | モバイル | 広告SDK選定、モバイル案件と連携 | wave4 W4-04 |
| 3   | W5-02 | 便利機能（乱数表・組み合わせ・得点記録・トーナメント/リーグ） | XL   | ❌ 未着手   | なし     | 要件定義から着手                | wave4 W4-06 |

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

## W5-01 広告機能（旧 W4-04）

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

## W5-02 便利機能（旧 W4-06）

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
