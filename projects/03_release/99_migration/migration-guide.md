# サービス名変更手順書

> サービス名をリネームする際の全手順（ソースコード・インフラ・GitHub・ローカルディレクトリ・VS Code ワークスペース紐付け）

---

## 前提条件

- VS Code を閉じた状態（ディレクトリリネーム + ワークスペース再紐付けに必要）
- Docker Desktop が起動中
- GitHub リポジトリの管理者権限

---

## Step 1: ソースコード・設定ファイルの置換

旧サービス名を新サービス名に一括置換する。対象ファイルは以下の通り。

### 1-1. バックエンド ソースコード（4ファイル）

| ファイル                                                             | 変更箇所                                    |
| -------------------------------------------------------------------- | ------------------------------------------- |
| `backend/src/application/analytics/usecase/ExportCalendarUseCase.ts` | カレンダー名 + PRODID の company            |
| `backend/src/api/front/export/controllers/exportController.ts`       | ダウンロードファイル名 (`xxx-calendar.ics`) |
| `backend/src/_sharedTech/config/AppSecretsLoader.ts`                 | `SECRET_KEY_APP` (`xxx/secrets`)            |
| `backend/src/integration/billing/RevenueCatBillingService.ts`        | `LIFETIME_PRODUCT_ID` (`xxx_lifetime`)      |

### 1-2. フロントエンド ソースコード（6ファイル）

| ファイル                                                             | 変更箇所                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------- |
| `frontend/index.html`                                                | `<title>` タグ                                        |
| `frontend/src/features/auth/pages/LoginPage.tsx`                     | CardTitle テキスト                                    |
| `frontend/src/features/auth/pages/SignupPage.tsx`                    | CardDescription テキスト                              |
| `frontend/src/features/schedule/pages/MainMenuPage.tsx`              | ヘッダー `<h1>` テキスト                              |
| `frontend/src/shared/components/AppLayout.tsx`                       | デフォルトタイトルのフォールバック値                  |
| `frontend/src/features/analytics/components/AddToCalendarButton.tsx` | PRODID、UID ドメイン、ダウンロードファイル名（3箇所） |

### 1-3. 環境変数・インフラ設定（6ファイル）

| ファイル                      | 変更箇所                                       |
| ----------------------------- | ---------------------------------------------- |
| `package.json`（ルート）      | `"name"` フィールド                            |
| `docker-compose.yml`          | コメント、コンテナ名（×2）、ボリューム名（×4） |
| `infra/localstack/init-s3.sh` | S3 バケット名（×4）                            |
| `backend/env/.env.local`      | `S3_BUCKET`                                    |
| `backend/env/.env.production` | `SECRETS_MANAGER_SECRET_NAME`                  |
| `backend/env/.env.shared`     | コメント内の `SECRETS_MANAGER_SECRET_NAME`     |

### 命名規約マッピング

以下のパターンごとに統一的に置換する。

| パターン   | 例（旧 → 新）                            |
| ---------- | ---------------------------------------- |
| lowercase  | `tsudocan` → `tsunaca`                   |
| PascalCase | `TsudoCan` → `Tsunaca`                   |
| kebab-case | `tsudocan-postgres` → `tsunaca-postgres` |
| snake_case | `tsudocan_lifetime` → `tsunaca_lifetime` |
| パス形式   | `tsudocan/secrets` → `tsunaca/secrets`   |
| UPPER      | `TSUDOCAN*` → `TSUNACA*`                 |

### 置換漏れ確認

```bash
# 旧名が残っていないことを確認（結果が0件であること）
grep -r "旧サービス名" --include='*.ts' --include='*.tsx' --include='*.html' --include='*.json' --include='*.yml' --include='*.sh' --include='*.md' backend/ frontend/ infra/ *.json *.yml *.md
```

---

## Step 2: ドキュメントの置換

Markdown ドキュメント内の旧サービス名を新サービス名に置換する。

| ファイル                                                            | 概算箇所数                   |
| ------------------------------------------------------------------- | ---------------------------- |
| `README.md`                                                         | 1                            |
| `memo.md`                                                           | 1                            |
| `project-understanding.md`                                          | 1                            |
| `infra/infra.md`                                                    | 約10                         |
| `backend/env/secrets-architecture.md`                               | 2                            |
| `projects/01_arc_docs/cloudservice-setting.md`                      | 約25（product ID、表示名等） |
| `projects/00_/202604_02_liff-integration/overview.md`               | 1                            |
| `projects/00_/202603_01_frontend-reform/archive/phase3-progress.md` | 4                            |

---

## Step 3: ビルド検証

```bash
# バックエンド 型チェック
cd backend && npx tsc -p tsconfig.server.json --noEmit

# フロントエンド 型チェック
cd frontend && npx tsc --noEmit

# バックエンド dist/ を再ビルド
cd backend && npx tsc -p tsconfig.server.json
```

---

## Step 4: Docker ボリューム再作成

ボリューム名が変わるため、旧ボリュームを削除して新名で再作成する。

```bash
# 旧名のコンテナが残っている場合は停止・削除
docker ps -a --format '{{.Names}}' | grep 旧サービス名 | xargs -r docker stop
docker ps -a --format '{{.Names}}' | grep 旧サービス名 | xargs -r docker rm

# プロジェクトルートで実行
cd /path/to/project
docker compose down -v
docker compose up -d

# DB 起動後にマイグレーション + シードデータ投入
cd backend
sleep 3
env $(grep -v '^#' env/.env.local | grep -v '^$' | xargs) pnpm prisma migrate deploy
PGPASSWORD=app_password psql -h localhost -p 5432 -U app_user -d tsunaca \
  -f infra/database/seeds/testdata/e2e-seed-data.sql
```

---

## Step 5: GitHub リポジトリ名の変更

1. `https://github.com/<owner>/<旧リポ名>/settings` にアクセス
2. 「**Repository name**」を新名に変更
3. 「**Rename**」ボタンをクリック
4. ローカルの git remote を更新:

```bash
git remote set-url origin git@github.com:<owner>/<新リポ名>.git
git remote -v  # 確認
```

> GitHub は旧 URL → 新 URL への自動リダイレクトを設定してくれるため、既存リンクがすぐ壊れることはない。

---

## Step 6: ローカルディレクトリ名の変更 + VS Code チャット履歴の移行

VS Code は Copilot チャット履歴をワークスペースのディレクトリパスに紐付けて保存しているため、ディレクトリ名を変更すると過去のチャット履歴が見えなくなる。以下の手順で移行する。

### 6-1. VS Code を完全に閉じる

### 6-2. 移行スクリプトを実行

同梱の `restore-chat-history.sh` がディレクトリリネーム + チャット履歴移行をすべて行う。

```bash
bash projects/03_release/99_migration/restore-chat-history.sh 旧ディレクトリ名 新ディレクトリ名
```

スクリプトが行うこと:
1. `~/旧ディレクトリ名` → `~/新ディレクトリ名` へリネーム
2. VS Code を新ディレクトリで起動（新ワークスペースストレージ作成のため）→ 閉じるまで待機
3. 旧/新ワークスペースストレージの自動特定
4. 新ワークスペースストレージのバックアップ自動作成
5. `state.vscdb` 内のチャットインデックス（`chat.ChatSessionStore.index`, `agentSessions.state.cache`）のマージ
6. `chatSessions/`, `chatEditingSessions/`, `GitHub.copilot-chat/` のファイルコピー

### 6-3. VS Code を新ディレクトリから開いて確認

スクリプト完了後、指示通り VS Code を開く:

```bash
code ~/新ディレクトリ名
```

過去の Copilot チャットセッションが表示されることを確認する。

> **補足**: チャット履歴の移行を確認できたら、旧ストレージフォルダは削除してOK。

---

## チェックリスト

- [ ] ソースコード置換（BE 4 + FE 6 ファイル）
- [ ] 環境変数・インフラ設定置換（6ファイル）
- [ ] ドキュメント置換（約8ファイル）
- [ ] `grep` で置換漏れ確認（0件）
- [ ] バックエンド `tsc` 通過
- [ ] フロントエンド `tsc` 通過
- [ ] バックエンド `dist/` 再ビルド済み
- [ ] Docker ボリューム新名で再作成済み
- [ ] マイグレーション適用済み
- [ ] シードデータ投入済み
- [ ] GitHub リポジトリ名変更済み
- [ ] `git remote` 更新済み
- [ ] ローカルディレクトリ名変更済み
- [ ] VS Code チャット履歴移行済み
