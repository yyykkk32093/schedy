# 外部サービス設定手順書

> **最終更新**: 2026-04-04

このドキュメントでは、Tsunaca が依存する外部サービスの設定手順を説明します。

---

## 課金アーキテクチャ方針

### サブスクリプション管理: RevenueCat に一本化

| プラットフォーム | SDK                                             | 裏の決済エンジン                  |
| ---------------- | ----------------------------------------------- | --------------------------------- |
| iOS              | RevenueCat Native SDK                           | Apple IAP                         |
| Android          | RevenueCat Native SDK                           | Google Play Billing               |
| Web              | RevenueCat Web SDK (`@revenuecat/purchases-js`) | Stripe（RevenueCat が内部で利用） |

**方針**: 全プラットフォームの課金を **RevenueCat API 1本** で管理する。  
Web ブラウザは IAP（Apple/Google のネイティブアプリ内課金 API）を呼べないため、RevenueCat Web SDK が裏で Stripe を決済エンジンとして使う。  
アプリ側からは RevenueCat のインターフェースだけを使い、裏の決済エンジンの違いを意識しない。

> ✅ **削除済み**: W4-02 で実装していた Stripe Billing 直接連携（`Subscription` テーブル・`StripeEvent` テーブル・Billing 用 UseCase 5本・API 4本）は RevenueCat Web SDK 統合に伴い削除済み。

### 参加費決済: Stripe Connect Express

アクティビティ参加費の決済は **Stripe Connect Express（Destination Charges）** を使用。  
これはサブスクリプション管理（RevenueCat）とは**完全に別系統**。

| 支払い方法       | 確認方式                      |
| ---------------- | ----------------------------- |
| 現金             | 管理者手動確認                |
| PayPay           | ユーザー手動報告 + 管理者承認 |
| Stripe（カード） | Webhook 自動確認              |

---

## 1. Stripe（参加費決済 — Stripe Connect Express）

> **用途**: アクティビティ参加費のカード決済。コミュニティごとに Connect Express アカウントを紐付け、Destination Charges で送金する。  
> **サブスクリプション管理には使わない**（サブスクは RevenueCat で一本化）。

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
3. **公開可能キー** もコピー:
   - `VITE_STRIPE_PUBLISHABLE_KEY` → フロントエンド用
   - テスト環境: `pk_test_xxxx`

### 1-3. Connect 設定

1. **設定** → **Connect** → **プラットフォームを設定** をクリック
2. 「Express」を選択
3. プラットフォームの詳細を入力:
   - プラットフォーム名: `Tsunaca`
   - ビジネスカテゴリ: `ソフトウェア・プラットフォーム`
4. **ブランド設定**:
   - アイコン画像をアップロード
   - ブランドカラーを設定

### 1-4. Webhook 設定

1. **開発者** → **Webhook** → **+ エンドポイントを追加**
2. エンドポイント URL:
   - 本番: `https://api.your-domain.com/v1/webhooks/stripe`
   - ローカル開発: Stripe CLI を使用（後述）
3. イベントを選択（Connect — 参加費決済用）:
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
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# 出力される webhook signing secret を .env.local の STRIPE_WEBHOOK_SECRET に設定
```

### 1-6. フロントエンド決済 UI（Stripe Payment Element）

Stripe の決済入力フォームは **Payment Element** を使用。Stripe が提供する iframe ベースの UI コンポーネント。

#### 提供される仕組み

| 項目              | 詳細                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| UI コンポーネント | `@stripe/react-stripe-js` の `<PaymentElement>`                         |
| ホスト            | iframe が `js.stripe.com` ドメインでレンダリングされる                  |
| セキュリティ      | クロスオリジン分離により、カード情報は Tsunaca サーバーに一切到達しない |
| PCI 準拠          | Stripe は PCI DSS Level 1（最高レベル）認証取得済み                     |
| 暗号化            | AES-256, TLS — 通信・保管ともに暗号化                                   |

#### カスタム可能範囲

- `appearance` オプションでテーマ・カラー・borderRadius をカスタマイズ可能
- `layout: 'tabs'` で支払い方法をタブ切り替え表示（現在はカードのみ）
- `locale: 'ja'` で日本語ラベル自動適用
- フォーム外のテキスト（金額表示・説明文・ボタン）は自由にカスタマイズ可能

#### Tsunaca での表示構成

```
┌─────────────────────────────┐
│ お支払い                     │
├─────────────────────────────┤
│ 参加費:        ¥X,XXX       │
│ 手数料 (?):    ¥XXX         │  ← (?) で手数料理由ダイアログ
│ ───────────────────         │
│ 合計:          ¥X,XXX       │
├─────────────────────────────┤
│ 支払いには Stripe 社の       │
│ 決済サービスを利用しています  │  ← Stripe セキュリティページへのリンク
│ ※ カード情報を保持しません   │
├─────────────────────────────┤
│ ┌─── Stripe iframe ───┐    │
│ │ カード番号           │    │  ← Stripe が提供する iframe
│ │ 有効期限  CVC        │    │
│ └─────────────────────┘    │
├─────────────────────────────┤
│ [キャンセル]  [¥X,XXX を支払う] │
└─────────────────────────────┘
```

#### セキュリティ参考リンク

- Stripe セキュリティページ: https://docs.stripe.com/security/stripe

### 1-7. テスト用カード番号

| カード番号            | 用途                 |
| --------------------- | -------------------- |
| `4242 4242 4242 4242` | 通常の成功テスト     |
| `4000 0025 0000 3155` | 3D Secure 認証テスト |
| `4000 0000 0000 9995` | 支払い失敗テスト     |

有効期限: 未来の任意日付、CVC: 任意3桁、郵便番号: 任意

### 1-8. 環境変数

| 変数名                        | 説明                      | 例             | 設定先                |
| ----------------------------- | ------------------------- | -------------- | --------------------- |
| `STRIPE_SECRET_KEY`           | Stripe のシークレットキー | `sk_test_xxxx` | backend `.env.local`  |
| `STRIPE_WEBHOOK_SECRET`       | Webhook 署名シークレット  | `whsec_xxxx`   | backend `.env.local`  |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe の公開可能キー     | `pk_test_xxxx` | frontend `.env.local` |

---

## 2. RevenueCat（サブスクリプション管理 — 全プラットフォーム統一）

> **用途**: iOS / Android / Web の全プラットフォームのサブスクリプション管理を一元化。  
> Web 版は RevenueCat Web SDK が裏で Stripe を決済エンジンとして使用する。  
> バックエンドは RevenueCat Webhook 1本で `User.plan` を更新する。

### 2-1. RevenueCat プロジェクト作成

1. [RevenueCat Dashboard](https://app.revenuecat.com/) でアカウント作成
2. **+ New Project** → プロジェクト名: `Tsunaca`

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

#### Web（Stripe 連携）

> Web 版は RevenueCat Web SDK（`@revenuecat/purchases-js`）が裏で Stripe を決済エンジンとして使う。
> RevenueCat ダッシュボードで Stripe OAuth 連携を行い、Web Billing App を追加する。

1. **Apps** → **+ New** → **Web** → **Stripe**
2. Stripe アカウント連携（OAuth）:
   - 「Connect to Stripe」をクリック → Stripe にログイン → 認可
   - RevenueCat が Stripe 上に Product / Price を自動管理する
3. API キーをメモ:
   - **Sandbox API key**: `rcb_test_xxxx`（開発用）
   - **Production API key**: `rcb_xxxx`（本番用）
4. Products 作成:
   - **Products** → **+ New** → App: **Web (Stripe)** を選択
   - Identifier: `tsunaca_web_monthly_320`
   - Stripe 上に自動で Price が作成される
   - Entitlement: `pro` に紐付け
5. フロントエンド環境変数に Web API キーを設定:
   - `VITE_REVENUECAT_WEB_API_KEY=rcb_test_xxxx`（Sandbox）
   - 本番デプロイ時は `rcb_xxxx`（Production）に切り替え

### 2-3. Entitlement 設定

1. **Entitlements** → **+ New**
2. Identifier: `pro`
3. Description: `Tsunaca Pro features`

### 2-4. Product 設定

#### 月額サブスクリプション
1. **Products** → **+ New**
2. Identifier: `tsunaca_monthly_320`（App Store / Google Play の product ID と一致）
3. 価格: 320 JPY / 月
4. Entitlement: `pro` に紐付け

#### LIFETIME 買い切り
1. **Products** → **+ New**
2. Identifier: `tsunaca_lifetime`
3. 種類: **Non-renewing** / **One-time purchase**
4. 価格: 5,980 JPY
5. Entitlement: `pro` に紐付け

### 2-5. Offering 設定

1. **Offerings** → **Current** offering に上記 Products を追加
2. **Packages**:
   - `$rc_monthly` → `tsunaca_monthly_320`
   - `$rc_lifetime` → `tsunaca_lifetime`

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

| 変数名                          | 説明                                       | 例                     |
| ------------------------------- | ------------------------------------------ | ---------------------- |
| `REVENUECAT_API_KEY`            | RevenueCat のシークレット API キー（BE用） | `sk_xxxx`              |
| `REVENUECAT_WEBHOOK_AUTH_TOKEN` | Webhook 認証トークン（任意の文字列）       | `my-secure-token-xxxx` |
| `VITE_REVENUECAT_WEB_API_KEY`   | RevenueCat Web Billing API キー（FE用）    | `rcb_test_xxxx`        |

---

## 3. App Store Connect（iOS）

### 3-1. アプリ作成

1. [App Store Connect](https://appstoreconnect.apple.com/) にログイン
2. **マイApp** → **+** → **新規App**
3. アプリ情報を入力

### 3-2. App 内課金設定

#### 月額自動更新サブスクリプション
1. **サブスクリプション** → **+** → **サブスクリプショングループ** を作成
   - グループ名: `Tsunaca Pro`
2. **+ サブスクリプション**:
   - 製品 ID: `tsunaca_monthly_320`（RevenueCat の Product Identifier と一致）
   - 参照名: `月額プラン`
   - サブスクリプション期間: **1ヶ月**
3. **価格**:
   - 基本通貨: JPY
   - 価格: 320 円
4. **ローカリゼーション**:
   - 表示名: `Tsunaca Pro 月額プラン`
   - 説明: `チャット、DM、スタンプなどのプレミアム機能が使い放題`

#### LIFETIME（Non-consumable）
1. **App 内課金** → **+**
2. 種類: **非消費型**
3. 製品 ID: `tsunaca_lifetime`
4. 参照名: `LIFETIME プラン`
5. 価格: 5,980 円
6. ローカリゼーション:
   - 表示名: `Tsunaca Pro LIFETIME`
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
2. 商品 ID: `tsunaca_monthly_320`
3. 名前: `Tsunaca Pro 月額プラン`
4. **基本プラン** を追加:
   - 請求期間: **1ヶ月**
   - 価格: 320 円

#### LIFETIME（アプリ内アイテム）
1. **収益化** → **アプリ内アイテム** → **アイテムを作成**
2. 商品 ID: `tsunaca_lifetime`
3. 名前: `Tsunaca Pro LIFETIME`
4. 価格: 5,980 円

### 4-3. Real-time Developer Notifications

1. **収益化** → **収益化のセットアップ**
2. **Google Cloud Pub/Sub トピック名** を設定
3. RevenueCat Dashboard → **Apps** → Google Play App → **Google Real-time Developer Notifications** で Pub/Sub トピックを設定

---

## 5. フロントエンド設定（RevenueCat SDK）

### 5-1. Web（RevenueCat Web SDK）

```bash
# インストール
pnpm add @revenuecat/purchases-js
```

```typescript
import Purchases from '@revenuecat/purchases-js'

// 初期化
const purchases = Purchases.configure(
    'rcb_xxxx', // RevenueCat の Web public API key
    userId      // アプリ内ユーザーID
)

// サブスク購入
const offering = await purchases.getOfferings()
const pkg = offering.current?.availablePackages[0]
if (pkg) {
    const { customerInfo } = await purchases.purchase({ rcPackage: pkg })
}
```

### 5-2. iOS（Swift SDK — ネイティブアプリ）

```swift
import RevenueCat

// AppDelegate or @main
Purchases.configure(withAPIKey: "appl_xxxx")

// ユーザーログイン後
Purchases.shared.logIn(userId)
```

### 5-3. Android（Kotlin SDK — ネイティブアプリ）

```kotlin
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

// Application.onCreate
Purchases.configure(
    PurchasesConfiguration.Builder(this, "goog_xxxx").build()
)

// ユーザーログイン後
Purchases.sharedInstance.logInWith(userId)
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

### Stripe（参加費決済 — Connect）
- [ ] Stripe アカウント作成
- [ ] Connect Express プラットフォーム設定
- [ ] Webhook エンドポイント登録（Connect 系イベント）
- [ ] Stripe CLI でローカル Webhook 転送確認
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` を `.env.local` に設定
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` をフロントエンド `.env.local` に設定
- [ ] テストカード `4242...` で決済フロー動作確認

### RevenueCat（サブスク管理 — 全プラットフォーム統一）
- [ ] RevenueCat プロジェクト作成
- [ ] iOS / Android / Web アプリ追加
- [ ] Entitlement `pro` 作成
- [ ] Products 作成（`tsunaca_monthly_320` + `tsunaca_lifetime`）
- [ ] Offerings 設定（`$rc_monthly` + `$rc_lifetime`）
- [ ] Webhook URL 設定（`/v1/webhooks/revenuecat`）
- [ ] `REVENUECAT_API_KEY` / `REVENUECAT_WEBHOOK_AUTH_TOKEN` を `.env.local` に設定

### ストア（iOS / Android）
- [ ] App Store Connect にサブスク・非消費型を作成
- [ ] App Store Server Notifications → RevenueCat URL 設定
- [ ] Google Play Console にサブスク・アプリ内アイテムを作成
- [ ] Google Real-time Developer Notifications → RevenueCat Pub/Sub 設定

### 本番環境
- [ ] AWS Secrets Manager に JSON を登録
