# Phase 1 — コミュニティ作成改革（W5-10）

> **最終更新**: 2026-07-24
> **ステータス**: ✅ Phase 1 完了

## フェーズ概要
- **ゴール**: コミュニティ作成フローのDB〜フロントエンド一括改善
- **対象**: DB/Domain/UseCase/API/UI（全レイヤー）

---

## タスク一覧

| タスク                                       | 状態   | 備考                                                                              |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Prisma スキーマ変更                          | ✅ 完了 | ageRange→ageMin/ageMax、categoryId FK、recommendedLevelMin/Max 追加               |
| マイグレーション作成・適用                   | ✅ 完了 | `20260323052054_wave5_community_creation_reform`。マスタデータ更新含む            |
| ParticipationLevelMaster 9段階更新           | ✅ 完了 | pl-0〜pl-8（経験不問〜プロ・競技レベル）                                          |
| CategoryMaster→CommunityTypeMaster FK 追加   | ✅ 完了 | cat-badminton等→ct-sports、cat-other→ct-hobby                                     |
| シードデータ更新・再投入                     | ✅ 完了 | e2e-seed-data.sql、yoga-bulk-members.sql                                          |
| Community Entity 更新                        | ✅ 完了 | create/createChild/reconstruct/update/getters 全メソッド                          |
| CommunityRepositoryImpl 更新                 | ✅ 完了 | save/toDomain/findDetailById/searchPublic/findPublicDetailById                    |
| ICommunityRepository 型更新                  | ✅ 完了 | CommunityDetail/PublicCommunitySearchItem 型                                      |
| communitySchemas.ts 更新                     | ✅ 完了 | communityTypeId/categoryIds/participationLevelIds/ageRange 削除、新フィールド追加 |
| communityController.ts 更新                  | ✅ 完了 | リクエストbody destructuring 変更                                                 |
| CreateCommunityUseCase 更新                  | ✅ 完了 | category→type自動解決ロジック追加                                                 |
| フロントエンド api.ts 型更新                 | ✅ 完了 | CreateCommunityRequest/CommunityDetail/PublicCommunitySearchItem                  |
| shadcn/ui Slider 導入                        | ✅ 完了 | `pnpm dlx shadcn@latest add slider`                                               |
| CommunityCreatePage Step1 改修               | ✅ 完了 | communityType Select 削除                                                         |
| CommunityCreatePage Step2 改修               | ✅ 完了 | ageMin/ageMax Select、recommendedLevel Slider レンジ（0〜8）                      |
| CommunityCreatePage Step3 改修               | ✅ 完了 | カテゴリ単一選択化、確認プレビュー拡充                                            |
| CommunitySearchPage/DetailPage ageRange 対応 | ✅ 完了 | ageRange→ageMin/ageMax 表示変換                                                   |

---

## 持ち越し項目（Phase 1.5 で完了）

| 項目                                                    | 状態   | 完了日     |
| ------------------------------------------------------- | ------ | ---------- |
| UpdateCommunityUseCase / CommunitySettingsPage への反映 | ✅ 完了 | 2026-07-24 |
| AgeRange VO ファイル削除                                | ✅ 完了 | 2026-07-24 |
| activityFrequency 2段階ドロップダウン化                 | ✅ 完了 | 2026-07-24 |

---

## 作業ログ
- 2026-07-23: Phase 1 全タスク完了。DB→バックエンド→フロントエンドの順で一括実装。TS コンパイル（バックエンド・フロントエンド両方）エラーなし確認済み。
- 2026-07-24: Phase 1.5（持ち越し解消 + 追加機能）実装完了。
  - (1) Step2 Select空文字バグ修正（AGE_OPTIONS value=''→'none'）
  - (2) サブコミュニティカルーセル（Backend: ICommunityRepository.findChildrenWithDetails + Impl + ListSubCommunitiesUseCase + Controller + Route、Frontend: SubCommunityCarouselコンポーネント + useSubCommunities hook + CommunityDetailPage組み込み）
  - (3) プラン変更フロー導線（ActionBarにプランボタン、CommunitySettingsPageにアップグレードリンク）
  - (4-a) UpdateCommunityUseCase + communitySchemas + communityControllerにtargetGender/ageMin/ageMax/categoryId/recommendedLevelMin/Max追加
  - (4-b) CommunitySettingsPageに性別/年齢/カテゴリ/レベルUI追加
  - (4-c) AgeRange VOファイル削除
  - (4-d) CommunityCreatePage activityFrequencyを2段階ドロップダウン化
  - TSコンパイルエラー0件確認済み
