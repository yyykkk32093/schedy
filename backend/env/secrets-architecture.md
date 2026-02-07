# シークレット管理アーキテクチャ

## 概要

アプリケーションのシークレット（OAuth認証情報、データベース接続情報など）を一元管理する仕組み。

- **本番環境**: AWS Secrets Manager から取得
- **ローカル/テスト環境**: 環境変数（process.env）から取得

---

## シークレット取得プロセス

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ server.ts                                                                    │
│   └── AppSecretsLoader.load()  ... アプリ起動時に1回だけ呼び出し            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ AppSecretsLoaderImpl (シングルトン)                                          │
│   場所: src/_sharedTech/config/AppSecretsLoader.ts                          │
│                                                                              │
│   load()                                                                     │
│     └── 役割: キャッシュ確認、なければdoLoad()を呼ぶ（並行呼び出し制御）    │
│                                                                              │
│   doLoad()                                                                   │
│     └── 役割: USE_SECRETS_MANAGER の値で分岐                                │
│         ├── true  → loadFromSecretsManager()                                │
│         └── false → loadFromEnv()                                           │
│                                                                              │
│   loadFromSecretsManager()                                                   │
│     └── 役割: ISecretsProvider を使って Secrets Manager から JSON 取得      │
│                                                                              │
│   loadFromEnv()                                                              │
│     └── 役割: process.env から各環境変数を取得                              │
│                                                                              │
│   getOAuth(): OAuthConfig                                                    │
│     └── 役割: キャッシュからOAuth設定を返す                                 │
│                                                                              │
│   getDatabase(): DatabaseConfig                                              │
│     └── 役割: キャッシュからDB設定を返す                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ AwsSecretsManagerProvider     │   │ EnvSecretsProvider            │
│ (本番環境)                     │   │ (ローカル/テスト環境)          │
│                               │   │                               │
│ getSecret<T>(key)             │   │ getSecret<T>(key)             │
│   └── AWS SDK で取得          │   │   └── process.env から構築    │
└───────────────────────────────┘   └───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GoogleOAuthProviderClient / LineOAuthProviderClient / AppleOAuthProviderClient│
│   場所: src/integration/oauth/                                               │
│                                                                              │
│   fetchProfile()                                                             │
│     └── const config = AppSecretsLoader.getOAuth().google  ... キャッシュから取得│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## クラス設計

```
┌─────────────────────────────────────────────────────────────────┐
│ ISecretsProvider (interface)                                     │
│   場所: src/_sharedTech/config/secrets/ISecretsProvider.ts      │
│                                                                  │
│   getSecret<T>(key: string): Promise<T>                         │
│     └── 役割: キーを指定してシークレットを取得（抽象化）        │
└─────────────────────────────────────────────────────────────────┘
           △
           │ implements
    ┌──────┴──────────────┐
    │                     │
┌───┴──────────────────┐  ┌───┴──────────────────┐
│AwsSecretsManager     │  │EnvSecretsProvider    │
│Provider              │  │                      │
│                      │  │                      │
│場所: secrets/        │  │場所: secrets/        │
│AwsSecretsManager     │  │EnvSecretsProvider.ts │
│Provider.ts           │  │                      │
│                      │  │                      │
│getSecret<T>(key)     │  │registerMapping()     │
│  └── AWS SDK で取得  │  │  └── キーごとの      │
│                      │  │      環境変数マッピング│
│                      │  │                      │
│                      │  │getSecret<T>(key)     │
│                      │  │  └── 登録済みの      │
│                      │  │      マッピングで取得 │
└──────────────────────┘  └──────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ AppSecretsLoader (シングルトン)                                  │
│   場所: src/_sharedTech/config/AppSecretsLoader.ts              │
│                                                                  │
│   - provider: ISecretsProvider | null                           │
│   - cache: AppSecrets | null                                    │
│                                                                  │
│   load(): Promise<AppSecrets>                                   │
│     └── 役割: シークレットをロードしてキャッシュ                │
│                                                                  │
│   getOAuth(): OAuthConfig                                        │
│     └── 役割: OAuth設定を返す                                   │
│                                                                  │
│   getDatabase(): DatabaseConfig                                  │
│     └── 役割: DB設定を返す                                      │
│                                                                  │
│   setCache(secrets): void                                        │
│     └── 役割: テスト用にキャッシュを直接設定                    │
│                                                                  │
│   setProvider(provider): void                                    │
│     └── 役割: テスト用にプロバイダを差し替え                    │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ AppSecrets (型)                                                  │
│                                                                  │
│   oauth: OAuthConfig                                             │
│     ├── google: GoogleOAuthConfig                               │
│     ├── line: LineOAuthConfig                                   │
│     └── apple: AppleOAuthConfig                                 │
│                                                                  │
│   database: DatabaseConfig                                       │
│     └── url: string                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Secrets Manager のシークレット構造

Secret Name: `schedy/secrets`

```json
{
  "oauth": {
    "google": {
      "clientId": "xxxx.apps.googleusercontent.com",
      "clientSecret": "GOCSPX-xxxx",
      "redirectUri": "https://app.example.com/auth/callback/google"
    },
    "line": {
      "channelId": "1234567890",
      "channelSecret": "xxxx",
      "redirectUri": "https://app.example.com/auth/callback/line"
    },
    "apple": {
      "clientId": "com.example.app",
      "teamId": "XXXXXXXXXX",
      "keyId": "XXXXXXXXXX",
      "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
      "redirectUri": "https://app.example.com/auth/callback/apple"
    }
  },
  "database": {
    "url": "postgresql://user:password@host:5432/dbname?schema=public"
  }
}
```

---

## 環境変数（ローカル/テスト）

```bash
# Secrets Manager を使わない
USE_SECRETS_MANAGER=false

# OAuth
GOOGLE_CLIENT_ID=local-google-client-id
GOOGLE_CLIENT_SECRET=local-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback/google

LINE_CHANNEL_ID=local-line-channel-id
LINE_CHANNEL_SECRET=local-line-channel-secret
LINE_REDIRECT_URI=http://localhost:5173/auth/callback/line

APPLE_CLIENT_ID=local-apple-client-id
APPLE_TEAM_ID=local-apple-team-id
APPLE_KEY_ID=local-apple-key-id
APPLE_PRIVATE_KEY=      # PEM形式（\nでエスケープ）
APPLE_PRIVATE_KEY_PATH= # またはファイルパス
APPLE_REDIRECT_URI=http://localhost:5173/auth/callback/apple

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public
```

---

## 環境変数（本番）

```bash
# Secrets Manager から取得
USE_SECRETS_MANAGER=true
SECRETS_MANAGER_SECRET_NAME=schedy/secrets
SECRETS_MANAGER_REGION=ap-northeast-1
```

---

## テスト時の使い方

```typescript
// E2E テストでは setCache() でダミー値を設定
AppSecretsLoader.setCache({
    oauth: {
        google: { clientId: "test", clientSecret: "test", redirectUri: "http://..." },
        line: { channelId: "test", channelSecret: "test", redirectUri: "http://..." },
        apple: { clientId: "test", teamId: "test", keyId: "test", privateKey: "test", redirectUri: "http://..." },
    },
    database: {
        url: process.env.DATABASE_URL ?? "",
    },
});
```

---

## ファイル構成

```
src/_sharedTech/config/
├── AppSecretsLoader.ts          # メインのシークレットローダー
├── loadEnv.ts                   # 環境変数読み込み
└── secrets/
    ├── ISecretsProvider.ts      # インターフェイス
    ├── AwsSecretsManagerProvider.ts  # AWS実装
    └── EnvSecretsProvider.ts    # 環境変数実装（ヘルパー関数）
```
