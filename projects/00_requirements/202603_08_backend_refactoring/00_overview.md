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

## 推奨実施順序

### Wave A: 即時着手（リスク小・効果大）
1. **[7] INDEX 補強** — マスタ・FK の INDEX 追加（migration 1〜2 本）
2. **[6] DDD 違反の Lint 化** — 新規違反の発生を防止
3. **[5] 未使用 API 削除＋ DeviceToken 対処方針決定** — Push 通知が機能していない件はプロダクト判断必要

### Wave B: 計画的に実施（中規模リファクタ）
4. **[6] DDD 違反の段階解消** — Help/Inquiry → Stamp/Notification → Middleware → Analytics
5. **[8] ディレクトリ構成の命名統一・規約化** — Wave B と並行
6. **[9] API 命名規則ガイドライン整備** — `/v2/` 設計と並行可能

### Wave C: 大規模変更（メンテ枠が必要）
7. **[1] DB 名変更** + **[4] PostgreSQL 慣習化** + **[3] マスタ命名統一** をまとめて 1 メンテ枠で実施
8. **[2] スキーマ分離** — 上記完了後、必要性を再評価

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
