# [3] マスターテーブル命名の不整合

> 評価日: 2026-05-11
> 結論: **対応推奨（命名規則を明文化して統一）**

## 現状調査

マスタ/ルックアップ用途のテーブルで **`Master` suffix の有無が不統一**。

### 現在の命名

| モデル                        | 種別                                   | suffix | 行                                                           |
| ----------------------------- | -------------------------------------- | ------ | ------------------------------------------------------------ |
| `CategoryMaster`              | マスタ                                 | ✅ あり | [schema.prisma](../../../backend/prisma/schema.prisma#L924)  |
| `ParticipationLevelMaster`    | マスタ                                 | ✅ あり | [schema.prisma](../../../backend/prisma/schema.prisma#L968)  |
| `PlanMaster`                  | マスタ                                 | ✅ あり | [schema.prisma](../../../backend/prisma/schema.prisma#L1169) |
| `InquiryCategory`             | マスタ                                 | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L1207) |
| `ExpenseCategory`             | マスタ（コミュニティ単位の管理マスタ） | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L1124) |
| `UserFeatureRestriction`      | マスタ（プラン×機能の制限定義）        | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L638)  |
| `UserLimitRestriction`        | マスタ（プラン×上限値の定義）          | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L651)  |
| `CommunityFeatureRestriction` | マスタ（grade×機能）                   | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L664)  |
| `CommunityLimitRestriction`   | マスタ（grade×上限）                   | ❌ なし | [schema.prisma](../../../backend/prisma/schema.prisma#L677)  |

### 中間テーブル（マスタではない・除外対象）

これらは「コミュニティが選択しているマスタ値」を保持する **多対多の中間テーブル** であり、マスタではない:

- `CommunityCategory` — Community ↔ CategoryMaster
- `CommunityParticipationLevel` — Community ↔ ParticipationLevelMaster
- `CommunityActivityDay` — Community ↔ 曜日（値テーブル）
- `CommunityTag` — Community ↔ タグ文字列（値テーブル）

これらは現命名で問題なし（マスタ名 + Master suffix を付けると逆に紛らわしい）。

## 評価

### 命名分類が必要な観点

「マスタ」とひとくちに言っても以下 3 種が混在している：

| 分類                    | 特徴                                          | 例                                                                            |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| **A. 純粋マスタ**       | 全テナント共通・運用が SQL/seed で投入        | `CategoryMaster`, `ParticipationLevelMaster`, `PlanMaster`, `InquiryCategory` |
| **B. 設定マスタ**       | 運用ポリシー定義（プランや grade ごとの制限） | `UserFeatureRestriction`, `CommunityLimitRestriction` 等                      |
| **C. テナント別マスタ** | コミュニティが自由に追加できる管理用マスタ    | `ExpenseCategory`                                                             |

A と C は性質が異なる（A は運用が変えるもの、C はユーザーが変えるもの）。

## 推奨命名規則

### 案: 用途別 prefix/suffix で統一

| 分類                        | 命名規則                   | 例                                                                                  |
| --------------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| A. 純粋マスタ               | `XxxMaster`                | `CategoryMaster`, `ParticipationLevelMaster`, `PlanMaster`, `InquiryCategoryMaster` |
| B. 設定マスタ（プラン制限） | `XxxPolicy` または現状維持 | `UserFeaturePolicy`, `CommunityLimitPolicy`（よりドメイン用語に近い）               |
| C. テナント別マスタ         | `Xxx`（suffix なし）       | `ExpenseCategory`（既存維持）                                                       |

### リネーム候補（最小スコープ）

| 現名                          | 推奨名                        | 理由                                                 |
| ----------------------------- | ----------------------------- | ---------------------------------------------------- |
| `InquiryCategory`             | `InquiryCategoryMaster`       | 純粋マスタなので Master suffix 統一                  |
| `UserFeatureRestriction`      | `PlanFeaturePolicy`           | "User"-prefix だが実質はプラン定義（feature ON/OFF） |
| `UserLimitRestriction`        | `PlanLimitPolicy`             | 同上                                                 |
| `CommunityFeatureRestriction` | `CommunityGradeFeaturePolicy` | grade ベースであることを明示                         |
| `CommunityLimitRestriction`   | `CommunityGradeLimitPolicy`   | 同上                                                 |

## 実施コスト

| 作業                                                     | コスト                         |
| -------------------------------------------------------- | ------------------------------ |
| Prisma model rename + `@@map` で物理テーブル名を据え置き | 低                             |
| アプリコード内の参照置換（型・import）                   | 中（IDE のリネームで一括可能） |
| migration 作成（model 名のみ変更、テーブル変更なし）     | 低                             |
| ドキュメント更新                                         | 低                             |

## 優先度

🟡 **Medium** — [4] テーブル名 snake_case 化 と統合実施が効率的。
- 物理テーブル名は `@@map` で旧名維持すれば、データ・他ツール影響なし
- 後続で物理名も変える場合は別途 migration

## 関連項目
- [2] スキーマ分割（命名 prefix で論理分離する案A と統合可能）
- [4] PostgreSQL 慣習（テーブル名 snake_case）
