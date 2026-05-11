# [1] DB名 `reserve_manage` → `tsunaca` への変更

> 評価日: 2026-05-11
> 結論: **対応推奨（中規模作業・スケジュール調整必須）**

## 現状調査

`reserve_manage` という DB 名は、ローカル開発・ドキュメント・CI 設定など **20 オカレンス** で参照されている。

### 影響を受けるファイル

| ファイル                                                                         | 行                        | 内容                            |
| -------------------------------------------------------------------------------- | ------------------------- | ------------------------------- |
| [docker-compose.yml](../../../docker-compose.yml#L18)                            | 18, 22                    | `POSTGRES_DB`、healthcheck      |
| [backend/env/.env.example](../../../backend/env/.env.example#L10)                | 10                        | `DATABASE_URL` テンプレート     |
| `backend/env/.env.local`                                                         | 10                        | ローカル `DATABASE_URL`（実値） |
| [infra/infra.md](../../../infra/infra.md#L46)                                    | 46, 51                    | DB 接続情報の説明               |
| [.github/copilot-instructions.md](../../../.github/copilot-instructions.md#L204) | 204, 208                  | テストデータ投入コマンド        |
| [backend/backend_README.md](../../../backend/backend_README.md#L149)             | 149, 153–235 (約 11 箇所) | DB 初期化・検証・権限設定       |

加えて、本番/ステージング環境（クラウドの管理画面）にも参照あり。

## 評価

| 観点             | 内容                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| **必要性**       | プロジェクト名と DB 名の不整合は新規参画者が混乱するため、命名統一は意義あり |
| **技術的難易度** | 低（PostgreSQL の `CREATE DATABASE` + データ移行 or 新環境構築）             |
| **影響範囲**     | ローカル/CI/本番すべて。アプリコードへの影響はゼロ（環境変数のみ）           |
| **リスク**       | 本番 DB 名変更は無停止では難しい。連絡・作業窓口の調整が必要                 |

## 推奨アプローチ

ローカル/開発環境と本番/ステージングを **段階的に分離** して切り替える。

### Phase A: ローカル/開発環境
1. `docker-compose.yml` の `POSTGRES_DB` を `tsunaca` に変更
2. `.env.example` / `.env.local` の `DATABASE_URL` を更新
3. `backend_README.md` / `copilot-instructions.md` / `infra.md` の DB 名・コマンド例を一括置換
4. `pnpm prisma migrate reset --force` で再構築

### Phase B: ステージング/本番環境
1. メンテナンス枠を確保
2. `pg_dump` → 新 DB `tsunaca` に restore（または `ALTER DATABASE reserve_manage RENAME TO tsunaca;`）
   - ※ `ALTER DATABASE ... RENAME` は接続中セッションがあると失敗するため、メンテ中の停止が必要
3. アプリの環境変数 `DATABASE_URL` を切り替えてデプロイ
4. 旧 DB を一定期間バックアップとして保持

### チェックリスト
- [ ] `reserve_manage` の grep 結果が 0 件になること
- [ ] DB 名差分テスト（`SELECT current_database()` で確認）
- [ ] CI のローカル DB 起動が通ること
- [ ] バックアップ/リストア手順書の更新

## 優先度

🟡 **Medium** — リファクタリング全体（[2]〜[9]）の最初か最後にまとめてやるのが運用上スムーズ。
他項目とのシナジー: [2] スキーマ分割と同時実施だと本番停止枠を 1 回で済ませられる。
