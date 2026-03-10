# 外部サービス設定手順書

このドキュメントでは、Schedy が依存する外部サービスの設定手順を説明します。

---

## 1. Stripe（参加費決済 — Stripe Connect Express）

### 1-1. Stripe アカウント作成

1. [Stripe Dashboard](https://dashboard.stripe.com/register) でアカウント作成
2. 「ビジネスの詳細」を入力してアカウントを有効化
3. テスト環境ではテストモード（画面右上の「テストモード」トグル）で操作

### 1-2. API キー取得

1. **開発者** → **API キー** へ移動
2. 以下の値をコピー:
   - `シークレットキー` → `STRIPE_SECRET_KEY`
   - テスト環境: `sk_test_xxxx`
   - 本番環境: `sk_live_xxxx`

### 1-3. Connect 設定

1. **設定** → **Connect** → **プラットフォームを設定** をクリック
2. 「Express」を選択
3. プラットフォームの詳細を入力:
   - プラットフォーム名: `Schedy`
   - ビジネスカテゴリ: `ソフトウェア・プラットフォーム`
4. **ブランド設定**:
   - アイコン画像をアップロード
   - ブランドカラーを設定

### 1-4. Webhook 設定

1. **開発者** → **Webhook** → **+ エンドポイントを追加**
2. エンドポイント URL:
   - 本番: `https://api.your-domain.com/v1/stripe/webhooks`
   - ローカル開発: Stripe CLI を使用（後述）
3. イベントを選択:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `account.updated`（Connect アカウントのステータス変更検知）
4. **署名シークレット** をコピー → `STRIPE_WEBHOOK_SECRET`
   - `whsec_xxxx` 形式

### 1-5. ローカル開発用（Stripe CLI）

```bash
# Stripe CLI インストール
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhook をローカルに転送
stripe listen --forward-to localhost:3001/v1/stripe/webhooks

# 出力される webhook signing secret を .env.local の STRIPE_WEBHOOK_SECRET に設定
```

### 1-6. 環境変数

| 変数名                  | 説明                      | 例             |
| ----------------------- | ------------------------- | -------------- |
| `STRIPE_SECRET_KEY`     | Stripe のシークレットキー | `sk_test_xxxx` |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名シークレット  | `whsec_xxxx`   |

---

## 2. RevenueCat（サブスクリプション管理）

### 2-1. RevenueCat プロジェクト作成

1. [RevenueCat Dashboard](https://app.revenuecat.com/) でアカウント作成
2. **+ New Project** → プロジェクト名: `Schedy`

### 2-2. アプリ追加

#### iOS（App Store Connect）

1. **Apps** → **+ New** → **Apple App Store**
2. **Bundle ID**: Xcode プロジェクトの Bundle Identifier と一致
3. **App Store Connect App-Specific Shared Secret**:
   - App Store Connect → アプリ → **アプリ情報** → **App用共有シークレット** をコピー
4. RevenueCat に貼り付け

#### Android（Google Play Console）

1. **Apps** → **+ New** → **Google Play Store**
2. **Package Name**: `android/app/build.gradle` の applicationId と一致
3. **Service Account JSON**:
   - Google Cloud Console → **サービスアカウント** → JSON キーを作成
   - Google Play Console → **設定** → **API アクセス** でサービスアカウントを紐付け
4. RevenueCat に JSON キーをアップロード

### 2-3. Entitlement 設定

1. **Entitlements** → **+ New**
2. Identifier: `pro`
3. Description: `Schedy Pro features`

### 2-4. Product 設定

#### 月額サブスクリプション
1. **Products** → **+ New**
2. Identifier: `schedy_monthly_320`（App Store / Google Play の product ID と一致）
3. 価格: 320 JPY / 月
4. Entitlement: `pro` に紐付け

#### LIFETIME 買い切り
1. **Products** → **+ New**
2. Identifier: `schedy_lifetime`
3. 種類: **Non-renewing** / **One-time purchase**
4. 価格: 5,980 JPY
5. Entitlement: `pro` に紐付け

### 2-5. Offering 設定

1. **Offerings** → **Current** offering に上記 Products を追加
2. **Packages**:
   - `$rc_monthly` → `schedy_monthly_320`
   - `$rc_lifetime` → `schedy_lifetime`

### 2-6. API キー取得

1. **Project Settings** → **API Keys**
2. **Public app-specific API key** → フロントエンド（Capacitor）用
3. **Secret API key** → バックエンド用 → `REVENUECAT_API_KEY`

### 2-7. Webhook 設定

1. **Project Settings** → **Integrations** → **Webhooks**
2. **Webhook URL**:
   - 本番: `https://api.your-domain.com/v1/webhooks/revenuecat`
3. **Authorization header**:
   - Bearer トークンを任意の文字列で設定
   - 同じ値を `REVENUECAT_WEBHOOK_AUTH_TOKEN` に設定
4. イベント: 全イベントを有効にする（フィルタはサーバー側で行う）

### 2-8. 環境変数

| 変数名                          | 説明                                 | 例                     |
| ------------------------------- | ------------------------------------ | ---------------------- |
| `REVENUECAT_API_KEY`            | RevenueCat のシークレット API キー   | `sk_xxxx`              |
| `REVENUECAT_WEBHOOK_AUTH_TOKEN` | Webhook 認証トークン（任意の文字列） | `my-secure-token-xxxx` |

---

## 3. App Store Connect（iOS）

### 3-1. アプリ作成

1. [App Store Connect](https://appstoreconnect.apple.com/) にログイン
2. **マイApp** → **+** → **新規App**
3. アプリ情報を入力

### 3-2. App 内課金設定

#### 月額自動更新サブスクリプション
1. **サブスクリプション** → **+** → **サブスクリプショングループ** を作成
   - グループ名: `Schedy Pro`
2. **+ サブスクリプション**:
   - 製品 ID: `schedy_monthly_320`（RevenueCat の Product Identifier と一致）
   - 参照名: `月額プラン`
   - サブスクリプション期間: **1ヶ月**
3. **価格**:
   - 基本通貨: JPY
   - 価格: 320 円
4. **ローカリゼーション**:
   - 表示名: `Schedy Pro 月額プラン`
   - 説明: `チャット、DM、スタンプなどのプレミアム機能が使い放題`

#### LIFETIME（Non-consumable）
1. **App 内課金** → **+**
2. 種類: **非消費型**
3. 製品 ID: `schedy_lifetime`
4. 参照名: `LIFETIME プラン`
5. 価格: 5,980 円
6. ローカリゼーション:
   - 表示名: `Schedy Pro LIFETIME`
   - 説明: `一度の購入で永久にプレミアム機能が使えます`

### 3-3. App Store Server Notifications（推奨）

1. **App 情報** → **App Store Server Notifications**
2. **URL**: RevenueCat の Apple Server Notification URL を設定
   - RevenueCat Dashboard → **Apps** → Apple App → **Apple Server Notifications URL** をコピー

---

## 4. Google Play Console（Android）

### 4-1. アプリ作成

1. [Google Play Console](https://play.google.com/console/) にログイン
2. **すべてのアプリ** → **アプリを作成**

### 4-2. 定期購入設定

#### 月額サブスクリプション
1. **収益化** → **定期購入** → **定期購入を作成**
2. 商品 ID: `schedy_monthly_320`
3. 名前: `Schedy Pro 月額プラン`
4. **基本プラン** を追加:
   - 請求期間: **1ヶ月**
   - 価格: 320 円

#### LIFETIME（アプリ内アイテム）
1. **収益化** → **アプリ内アイテム** → **アイテムを作成**
2. 商品 ID: `schedy_lifetime`
3. 名前: `Schedy Pro LIFETIME`
4. 価格: 5,980 円

### 4-3. Real-time Developer Notifications

1. **収益化** → **収益化のセットアップ**
2. **Google Cloud Pub/Sub トピック名** を設定
3. RevenueCat Dashboard → **Apps** → Google Play App → **Google Real-time Developer Notifications** で Pub/Sub トピックを設定

---

## 5. フロントエンド設定（Capacitor）

### 5-1. RevenueCat Capacitor プラグイン（将来対応）

```bash
# インストール
npm install @revenuecat/purchases-capacitor

# iOS 同期
npx cap sync ios

# Android 同期
npx cap sync android
```

### 5-2. 初期化コード

```typescript
import Purchases from '@revenuecat/purchases-capacitor'

// iOS
await Purchases.configure({
    apiKey: 'appl_xxxx', // RevenueCat の iOS public API key
})

// Android
await Purchases.configure({
    apiKey: 'goog_xxxx', // RevenueCat の Android public API key
})

// ユーザーログイン後に呼ぶ
await Purchases.logIn({ appUserID: userId })
```

---

## 6. 本番環境の Secrets Manager 設定

AWS Secrets Manager の JSON ペイロード構造:

```json
{
    "oauth": {
        "google": { "clientId": "...", "clientSecret": "...", "redirectUri": "..." },
        "line": { "channelId": "...", "channelSecret": "...", "redirectUri": "..." },
        "apple": { "clientId": "...", "teamId": "...", "keyId": "...", "privateKey": "...", "redirectUri": "..." }
    },
    "database": {
        "url": "postgresql://..."
    },
    "stripe": {
        "secretKey": "sk_live_xxxx",
        "webhookSecret": "whsec_xxxx"
    },
    "revenueCat": {
        "apiKey": "sk_xxxx",
        "webhookAuthToken": "my-secure-token-xxxx"
    }
}
```

---

## チェックリスト

- [ ] Stripe アカウント作成・Connect 設定完了
- [ ] Stripe Webhook エンドポイント登録
- [ ] Stripe CLI でローカル開発確認
- [ ] RevenueCat プロジェクト作成
- [ ] RevenueCat に iOS / Android アプリ追加
- [ ] RevenueCat Entitlement `pro` 作成
- [ ] RevenueCat Products 作成（monthly + lifetime）
- [ ] RevenueCat Webhook URL 設定
- [ ] App Store Connect にサブスク・非消費型を作成
- [ ] Google Play Console にサブスク・アプリ内アイテムを作成
- [ ] 環境変数を `.env.local` に設定
- [ ] 本番は AWS Secrets Manager に JSON を登録
