# [4] テーブル名・カラム名を PostgreSQL 慣習に合わせる

> 評価日: 2026-05-11
> 結論: **対応推奨（ただし大規模変更・実施タイミングは要検討）**

## 現状調査

PostgreSQL 慣習: `snake_case` + 複数形テーブル名（活動的議論あり、業界標準は snake_case 単数か複数で揺れる）

| 規則               | 推奨                                    | 現状                                        |
| ------------------ | --------------------------------------- | ------------------------------------------- |
| テーブル名のケース | `snake_case`                            | **PascalCase**（Prisma デフォルト）         |
| カラム名のケース   | `snake_case`                            | **camelCase**（Prisma デフォルト）          |
| 複数形             | 複数形（"users"）または単数形（"user"） | 単数形                                      |
| 識別子クォート要否 | クォート不要に                          | **すべて要クォート**（"User", "createdAt"） |

### `@@map` / `@map` の使用状況

| 種別                          | 件数             | 詳細                                                                                                             |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@@map`（テーブルマッピング） | **1 モデルのみ** | `AuthSecurityState` → `auth_security_states` ([schema.prisma](../../../backend/prisma/schema.prisma#L317))       |
| `@map`（カラムマッピング）    | **9 カラム**     | すべて `AuthSecurityState` 内 + `User.system_role` ([schema.prisma](../../../backend/prisma/schema.prisma#L232)) |
| 未対応                        | **67 モデル**    | 残り全部                                                                                                         |

→ 命名統一が **崩れている状態**。`AuthSecurityState` だけ snake_case で、他は PascalCase。

## 評価

### 影響範囲

| レイヤ                              | 影響                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Prisma スキーマ                     | `@@map` / `@map` を 67 モデル × 全カラムに追加                         |
| アプリコード                        | **影響なし**（Prisma クライアント API は model 名/フィールド名で動作） |
| Raw SQL（seed, scripts, migration） | **大きく影響**（クォート付き識別子の書き換えが必要）                   |
| 監査ログ閲覧、psql 直叩き運用       | **改善**（クォート不要で楽）                                           |
| 外部 BI ツール・データベース GUI    | **改善**（PascalCase は非標準なため不便）                              |

### Raw SQL の存在箇所
- `backend/infra/database/ddl/`
- `backend/infra/database/seeds/`
- 既存 migration ファイル群（変更不要・履歴として残す）
- ドキュメント内のサンプルコマンド

### メリット
- 業界標準への準拠
- psql で `SELECT * FROM user;` のようにクォートなしで書ける
- 外部ツール（Metabase, Redash, pgAdmin）との相性が良い
- 大文字小文字の取り違えバグ回避

### デメリット
- migration が 1 本で巨大化（`ALTER TABLE "User" RENAME TO users` × 68）
- 既存の生 SQL すべて書き換え必要
- 本番停止枠は不要（`ALTER TABLE ... RENAME` はオンライン）が、デプロイ手順は慎重に
- アプリコードのレビューでは差分が見えない（`@@map` 追加だけ）→ 機械的に検証する仕組みが必要

## 推奨アプローチ

### Phase A: スキーマ側のみ統一（推奨第一歩）

**論理名（Prisma model/field）はそのまま、物理名（テーブル/カラム）を snake_case に。**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
```

- 全 67 モデルに対して機械的に処理
- migration は単一の rename + alter column 集約

### Phase B: 生 SQL の書き換え

- `infra/database/ddl/` の SQL → 新テーブル名に
- seed ファイル → 同上
- 開発ドキュメントのサンプル → 同上

### Phase C: 検証

- ローカルで `prisma migrate reset` → アプリ起動確認
- E2E テスト一通り
- `psql` で `\dt` 結果が snake_case になっていること
- 旧名でクエリが失敗することの確認（リネーム漏れ検出）

## 自動化のヒント

```bash
# モデル名抽出
grep "^model " backend/prisma/schema.prisma | awk '{print $2}'

# snake_case 変換は sed / node スクリプトで一括生成可能
# 例: User → users, OutboxEvent → outbox_events, AnnouncementRead → announcement_reads
```

スクリプトで `@@map` / `@map` を自動付与する案が現実的。Prisma 公式の `prisma format` だけでは対応不可。

## 優先度

🟡 **Medium** — DB 名変更 [1] / マスタ命名 [3] と同じタイミングで実施するのが効率的。
- すべてシード・migration 系の同時更新が発生するため、まとめて 1 回のメンテナンス枠で実施したい

## 注意点

- **既存 migration ファイルは触らない**。新しい migration で `@@map` を追加する形にする
- migration 名は `rename_all_tables_to_snake_case` のような分かりやすい名前に
- `migration_lock.toml` の整合性を確認

## 関連項目
- [1] DB 名変更（同時メンテ枠で実施推奨）
- [3] マスタ命名統一（model rename と組み合わせ）
