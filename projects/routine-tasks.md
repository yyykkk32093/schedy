# 🔁 定型作業ガイド

> プロジェクト開発中に定期的に実施する作業の手順・対象・ルールをまとめたドキュメント
> 本ファイルは全案件（`projects/` 配下）で横断的に適用される

---

## 案件管理ディレクトリ構成

各案件は `projects/{project-name}/` に配置する。案件ごとに `overview.md` を必ず作成し、必要に応じて `phase-N-progress.md` や `backlog/` を追加する。

```
projects/
├── routine-tasks.md                    ← 本ファイル（全案件共通）
└── {project-name}/                     ← 案件ディレクトリ
    ├── overview.md                     ← 案件概要・ゴール・スコープ（必須）
    ├── phase-N-progress.md             ← Phase別進捗（必要に応じて作成）
    └── backlog/                        ← バックログ（規模が大きい案件のみ）
        ├── backlog-overview.md
        └── phase-N-progress.md
```

**例**: `projects/frontend-reform/` は `overview.md` + `phase0〜4-progress.md` + `backlog/` を持つ大規模案件

---

## 1. 進捗管理（progress.md）の更新

### 対象ファイル

各案件ディレクトリ内の `overview.md`、`phase-N-progress.md`、`backlog/phase-N-progress.md` が対象。

```
projects/{project-name}/overview.md
projects/{project-name}/phase-N-progress.md
projects/{project-name}/backlog/phase-N-progress.md
```

### 更新タイミング

- Phase 内のタスクを **着手・完了・後回し** にした時
- 作業スレッド（セッション）の **終了時**

### 更新ルール

1. **ヘッダーの `最終更新` 日付** を当日に更新する
2. タスク行の **ステータス列** を以下のいずれかに変更する
   - `✅ 完了` — 実装＆動作確認済み
   - `🔜 後回し` — スコープ外としてバックログへ移動
   - `🚧 作業中` — 着手済み・未完了
   - `❌ 未着手` — 未着手
3. 必要に応じて **備考列** に技術的な補足・変更理由を追記する
4. Phase 全体が完了したら、ヘッダーのステータスを `✅ Phase N 完了` に更新する
5. 作業ログセクションがある場合は、日付＋実施内容を1行追記する

### 記述フォーマット例

```markdown
> **最終更新**: 2026-03-03
> **ステータス**: 🚧 作業中

| タスク      | 状態     | 備考                   |
| ----------- | -------- | ---------------------- |
| ○○ API 実装 | ✅ 完了   | authMiddleware 付き    |
| △△ UI 構築  | 🚧 作業中 | レスポンシブ対応が残り |
| □□ 分析機能 | 🔜 後回し | → バックログ BL-6      |

## 作業ログ
- 2026-03-03: ○○ API・△△ UI を実装。□□ はスコープ外としバックログへ
```

---

## 2. バックログ（backlog）の更新

### 対象ファイル

バックログの管理方法は案件規模に応じて選択する。

| 案件規模   | 管理方法                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------- |
| 大規模     | `projects/{project-name}/backlog/backlog-overview.md`（全体一覧）+ `phase-N-progress.md`（各Phase） |
| 小〜中規模 | `projects/{project-name}/overview.md` 内のタスク一覧セクションで管理                                |

### 更新タイミング

- Progress で `🔜 後回し` にした項目が発生した時
- 新たに「今のスコープでは対応しない」と判断した機能・課題が出た時
- バックログ項目に着手・完了した時

### 更新ルール

1. **新規項目の追加**
   - 統合 ID `UBL-N` を採番する（`backlog-overview.md` の全タスク一覧で最大番号 +1）
   - 該当する Phase の progress.md にタスクを追加する
   - `backlog-overview.md` の「全タスク一覧」テーブルにも行を追加する
   - 「由来」列に、どの Phase・作業で後回しにしたかを記載する
   - 「備考」列に、対応に必要な作業の概要（DB変更・API新設等）を記載する
2. **ステータス管理**
   - `🔲 未着手` → `🚧 作業中` → `✅ 完了`
   - **Phase progress.md と `backlog-overview.md` の両方** のステータス列を同期する
3. **Phase 完了時**
   - Phase progress.md のヘッダーステータスを `✅ 完了` に更新する
   - `backlog-overview.md` の「全タスク一覧」テーブルで該当 Phase の全タスクを `✅ 完了` に更新する
   - `backlog-overview.md` の作業ログに完了日と概要を追記する
4. **作業ログセクション** に日付＋追加/変更理由を1行追記する（progress.md と overview の両方）

### 記述フォーマット例

```markdown
| #    | タスク | ステータス | 由来    | 備考                              |
| ---- | ------ | ---------- | ------- | --------------------------------- |
| BL-6 | ○○機能 | 🔲 未着手   | Phase 2 | DBテーブル新設 + API + フロントUI |

## 作業ログ
- 2026-03-03: Phase 2 実装時に○○機能をバックログ化。DB設計から必要
```

---

## 3. 初期テストデータの更新

### 対象ファイル

| ファイル                                                  | 用途                      |
| --------------------------------------------------------- | ------------------------- |
| `backend/infra/database/seeds/testdata/e2e-seed-data.sql` | E2E動作確認用シードデータ |
| （今後追加される `*_testdata.sql`）                       | 各機能の動作確認用        |

### 更新タイミング

- **Prisma スキーマ変更**（カラム追加・テーブル追加）後
- **新機能の画面・API** が追加され、手動動作確認に既存テストデータでは不足する時
- **テストユーザーの追加・変更** が必要になった時

### 更新ルール

1. **ID 命名規則** を厳守する
   - ユーザー: `test-user-{name}-001`
   - コミュニティ: `test-community-{keyword}-001`
   - メンバーシップ: `test-membership-{community}-{user}`
   - アクティビティ: `test-activity-{keyword}`
   - アナウンスメント: `test-ann-{keyword}-001`
   - その他: `test-{entity}-{keyword}-{連番}`
2. **冪等性を担保** する
   - `INSERT ... ON CONFLICT DO NOTHING` を使用し、重複実行しても安全にする
3. **トランザクション** で囲む（`BEGIN; ... COMMIT;`）
4. **セクションコメント** で区切る（`-- ========== N. {エンティティ名} ==========`）
5. **削除用 SQL** をファイル末尾にコメントアウトで用意する（`DELETE FROM ... WHERE "id" LIKE 'test-%'`）
6. テーブル間の **外部キー依存順序** を守って INSERT する
   - User → PasswordCredential → auth_security_states → Community → CommunityMembership → Activity → Announcement → AnnouncementRead → ...

### 実行方法

```bash
# テストデータ投入
cd backend && PGPASSWORD=app_password psql -h localhost -p 5432 -U app_user -d reserve_manage \
  -f infra/database/seeds/testdata/e2e-seed-data.sql

# テストデータ削除（ファイル末尾の DELETE 文をコメント解除して実行、または直接）
cd backend && PGPASSWORD=app_password psql -h localhost -p 5432 -U app_user -d reserve_manage \
  -c "DELETE FROM \"AnnouncementRead\" WHERE \"id\" LIKE 'test-%'; ..."
```

### テストユーザー一覧（現在）

| ユーザー ID            | 名前   | Plan       | パスワード  |
| ---------------------- | ------ | ---------- | ----------- |
| `test-user-helena-001` | Helena | SUBSCRIBER | `Test1234!` |
| `test-user-daniel-001` | Daniel | FREE       | `Test1234!` |
| `test-user-sakura-001` | Sakura | FREE       | `Test1234!` |

---

## チェックリスト（作業終了時）

各セッション終了前に以下を確認：

- [ ] 該当案件の overview.md を最新化したか
- [ ] 該当案件の progress.md を最新化したか
- [ ] 後回し項目があればバックログに追記したか
- [ ] スキーマ変更や新機能追加があればテストデータを更新したか
