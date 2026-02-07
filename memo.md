ここは読まないでください。その時々のメモ書きです。

📊 現在の実装状況
✅ 完了済み
カテゴリ	内容
OAuth認証（Google/LINE/Apple）	Authorization Codeフローで signin 実装完了。初回ログイン時は自動 signup。
API	POST /v1/auth/oauth/:provider で Google/LINE/Apple に対応
DB スキーマ	GoogleCredential, LineCredential, AppleCredential テーブル作成済み
プロバイダクライアント	backend/src/integration/oauth/ に配置（Google/LINE/Apple）
UseCase	SignInOAuthUserUseCase.ts
ユニットテスト	SignInOAuthUserUseCase.test.ts
User entity 設計変更	registeredAuthMethod を User から削除。代わりに UserRegisteredEvent.authMethod でログ出力
PasswordUser テーブル削除	不要だったので schema から削除、migrate 済み
auth_security_states の P2003 対応	FK 違反時は best-effort として握りつぶし（debug ログのみ）
E2E テスト安定化	--no-file-parallelism --maxWorkers=1 で DB 競合を解消、全 6 件 PASS
🗂️ ディレクトリ構成（OAuth 関連）
📋 残り TODO / 課題
優先度	項目	状態
🔴 高	OAuth E2E テスト未実装	プロバイダを mock した統合テストがまだない
🟡 中	環境変数の整備	GOOGLE_CLIENT_ID, APPLE_TEAM_ID 等を env/.env.local / 本番に設定が必要
🟡 中	Apple の private key 管理	APPLE_PRIVATE_KEY を安全に渡す仕組み（Secrets Manager 等）が未整備
🟢 低	フロントエンド連携	OAuth redirect → callback → token 受け取りの UI 実装
🟢 低	リフレッシュトークン / トークン失効	現状 JWT 発行のみ。refresh 対応は未実装
🔧 直近で行った修正（このセッション）
E2E 安定化

beforeEach で事前ユーザー作成 + OutboxRetryPolicy を upsert に変更
test:e2e スクリプトを --no-file-parallelism --maxWorkers=1 に変更
P2003 警告対応

AuthSecurityStateRepositoryImpl の recordLoginSuccess / recordLoginFailure を try/catch でラップし、FK 違反は debug ログで握りつぶす
PasswordUser テーブル削除

schema.prisma から削除 → prisma migrate dev --name drop_password_user_table
import 修正

_usecaseFactory.ts の OAuth プロバイダ import を @/integration/oauth/ に変更
