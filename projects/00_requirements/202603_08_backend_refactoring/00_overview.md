# 202603_08 Backend Refactoring 評価まとめ

> 評価日: 2026-05-11
> 評価対象: [target.md](./target.md)

## 評価結果一覧

| #   | テーマ                                     | 結論                                                          | 優先度                          | 評価ファイル                                             |
| --- | ------------------------------------------ | ------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| 1   | DB 名 `reserve_manage` → `tsunaca`         | 対応推奨（中規模・スケジュール調整必須）                      | 🟡 Medium                        | [01_db-rename.md](./01_db-rename.md)                     |
| 2   | DB スキーマ分離（master / domain）         | 現時点 Low（命名 prefix で代替推奨）                          | 🟢 Low                           | [02_schema-separation.md](./02_schema-separation.md)     |
| 3   | マスターテーブル命名不統一                 | 対応推奨（命名規則明文化＋統一）                              | 🟡 Medium                        | [03_master-table-naming.md](./03_master-table-naming.md) |
| 4   | テーブル名 PostgreSQL 慣習化               | 対応推奨（大規模変更・要計画）                                | 🟡 Medium                        | [04_postgres-naming.md](./04_postgres-naming.md)         |
| 5   | 未使用 API・モデル（フロント連動完全評価） | モデル未使用は0件。`DeviceToken` 片肺運転＋未使用 API 4件確定 | 🔴 High（DeviceToken）/ 🟡 Medium | [05_unused-tables.md](./05_unused-tables.md)             |
| 6   | DDD 違反（Prisma 直叩き）                  | **対応必須**。Lint で防御＋計画的解消                         | 🔴 High                          | [06_ddd-violations.md](./06_ddd-violations.md)           |
| 7   | DB INDEX 付与状況                          | マスタ系・FK 一部で欠落 → 即時補強推奨                        | 🔴 High                          | [07_db-indexes.md](./07_db-indexes.md)                   |
| 8   | BE ディレクトリ構成                        | DDD 思想は良好。命名統一と責務定義が必要                      | 🟡 Medium                        | [08_directory-structure.md](./08_directory-structure.md) |
| 9   | BE RESTful 評価                            | 全体 Good。`masters/*` 解体と命名統一が必要                   | 🟡 Medium                        | [09_restful-assessment.md](./09_restful-assessment.md)   |

## 実装計画（確定版）

→ **[10_implementation-plan.md](./10_implementation-plan.md)** に Phase 構成・確定事項・検証戦略をまとめている。

### 方針サマリ
- **理想駆動**: 動いていないシステムなので移行コストを考慮せず、理想形に直接到達
- **本案件で全 Phase 対応**: 9 評価項目すべてを 1 案件で完遂
- **Phase 単位で順次 PR**: 中間状態を許容しつつロールバック容易性を確保
- **REST は v1 を直接破壊変更**（v2 並走なし、フロント同時更新）

### Phase 構成（実施順）

| Phase | 内容                                        | 対応項目              |
| ----- | ------------------------------------------- | --------------------- |
| 0     | 規約整備 + ESLint 防御線                    | [6][8][9]             |
| 1     | 不要 API・モデル削除                        | [5]                   |
| 2     | DDD 違反解消（Lint 違反全件解消）           | [6]                   |
| 3     | REST API 再設計（v1 破壊変更）              | [9] + [3] master 解体 |
| 4     | スキーマ分割 + 命名統一 + 物理名 snake_case | [2][3][4]             |
| 5     | Index 補強                                  | [7]                   |
| 6     | DB 名変更（reserve_manage → tsunaca）       | [1]                   |
| 7     | ディレクトリ統一 + Webhook 分離             | [8]                   |

### 主要な確定事項

| 論点               | 決定                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| DeviceToken        | 凍結（コード残置 + TODO）                                                                                                                   |
| ユーザー側 Inquiry | 削除                                                                                                                                        |
| Master 命名        | 3 層（XxxMaster / XxxPolicy / suffix なし）                                                                                                 |
| PG 物理名          | snake_case + 複数形（Prisma 論理名は維持）                                                                                                  |
| スキーマ分割       | 12 schema（identity / auth / master / outbox / community / activity / messaging / announcement / media / notification / billing / support） |
| Analytics          | Repository 押し込み（純粋 DDD）                                                                                                             |
| Lint               | ESLint でレイヤ間 import 規則強制                                                                                                           |
| Webhook            | webhookConfig（設定）+ integration/{stripe,revenuecat,fcm}（受信）に分離                                                                    |

## 共通テーマ・気付き

### 良い点
- DDD レイヤ構造は明確。Repository / UseCase / Controller の意図が読み取れる
- API Versioning と Resource-oriented 設計は概ね守られている
- DI コンテナ（`_usecaseFactory.ts`）が存在し、設計の中核がある

### 改善が必要な点
- DDD 規約の **Lint 強制が無い** → Help/Inquiry のような暫定実装が放置される
- **マスタテーブルの INDEX 欠落** が複数ある → 性能課題の予備軍
- **命名揺れ**（PascalCase vs snake_case、Master suffix の有無、camelCase vs kebab-case）が DB / コード / URL の各レイヤで存在
- Wave6 で追加された機能（Help/Inquiry/Matching）のソース品質が他より低い

### 横断的アクション
- **コーディング規約・命名規則の文書化**（backend/src/README.md または別ガイドライン）
- **Lint ルール強化**（Prisma 直叩き禁止、import 制約）
- **OpenAPI 仕様書の整備**（フロント連携・契約テストの基盤）
