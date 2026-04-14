# 外部サービス設定手順書

> **最終更新**: 2026-04-12

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

## 6. Google AdSense（広告 — Web）

> **用途**: FREE プランユーザー向けの広告表示。Web（Vite SPA）で AdSense を使用し、将来ネイティブアプリでは AdMob に移行する。
> **設計ドキュメント**: `projects/01_design/02_frontend/ads-architecture.md`
> **要件定義**: `projects/00_requirements/202603_06_bugfix-and-refactoring_wave5/W5-01-ads.md`

### 6-0. 事前に知っておくべきこと

| 項目                           | 内容                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| アカウントなしで実装できるか   | **コード・コンポーネントの実装自体は可能**。ただし実際の広告レンダリングには承認済みアカウント + サイト登録が必要 |
| `localhost` で広告表示できるか | **できない**。AdSense は登録済みドメインでのみ広告を配信する。ローカル開発ではモックモード（後述 6-6）を使用      |
| 審査にかかる期間               | 通常 **1〜2週間**。コンテンツが十分にあること（空サイトは通過しない）                                             |
| 推奨タイミング                 | 本番公開後に審査申請。**広告コードの実装は審査と完全に独立して進められる**（後述）                                |

#### 審査の前提条件（サイト成熟度）

AdSense 審査には **公開ドメイン上で外部からアクセスできる状態** が必須。開発期間中の申請は不可。

| 条件                           | 詳細                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| **公開アクセス可能なドメイン** | Basic 認証・IP 制限がかかっているサイトは審査できない                                              |
| **十分なオリジナルコンテンツ** | ダミーテキスト・空ページ・Lorem ipsum では弾かれる。実際のユーザーが利用する画面とコンテンツが必要 |
| **プライバシーポリシーページ** | Cookie 利用・第三者による情報収集について明記したページが必要                                      |
| **明確なナビゲーション**       | ヘッダー・フッター・メニューなどサイト構造が明確であること                                         |
| **ドメイン年齢**               | 明確な最低基準はないが、取得直後のドメインは初回で落ちることがある                                 |

> **結論**: 審査申請は **本番公開後**（ユーザーが使える状態になってから）が現実的。
> ただし **広告機能のコード実装は審査と完全に独立**しており、審査前に全て完了できる。
> 審査が通ったら `.env` の `VITE_AD_MODE` を `mock` → `production` に切り替えるだけ。コード変更は不要。

#### 実装と審査のタイムライン

```
開発期間                                    本番公開
├─── 広告コード実装（モックモードで開発）───┤
│    AdBanner / useAd / adConfig 等         │
│    VITE_AD_MODE=mock で動作確認           │
│    → アカウントもドメインも不要           │
│                                           ├─── AdSense 審査申請
│                                           │    （公開ドメイン + コンテンツ必要）
│                                           │
│                                           ├─── 審査通過（1〜2週間）
│                                           │    パブリッシャーID 取得
│                                           │    ads.txt 配置
│                                           │    広告ユニット作成
│                                           │
│                                           ├─── VITE_AD_MODE=production に変更
│                                           │    → 実広告表示開始（コード変更なし）
```

### 6-1. AdSense アカウント作成

1. [Google AdSense](https://www.google.com/adsense/) にアクセス
2. Google アカウントでログイン（ビジネス用推奨）
3. **「ご利用開始」** をクリック
4. 必要情報を入力:
   - **ウェブサイトの URL**: 本番ドメイン（例: `https://tsunaca.com`）
   - **お支払い先の国**: 日本
   - **利用規約に同意**
5. お支払い情報（銀行口座）を入力
   - 収益が支払い基準額（¥8,000）に達した時点で振込が行われる

### 6-2. サイト登録・審査

1. AdSense ダッシュボード → **サイト** → **サイトを追加**
2. 本番ドメインを入力（例: `tsunaca.com`）
3. **確認用コード** の設置（以下のいずれか）:
   - **AdSense コードスニペット**: `<head>` に `<meta>` タグまたはスクリプトを追加
   - **ads.txt**: ルートに `ads.txt` ファイルを配置（推奨 — 後述）
4. **「審査をリクエスト」** をクリック
5. 審査は通常 **1〜2週間**。以下が審査通過の条件:
   - サイトに十分なオリジナルコンテンツがあること
   - AdSense ポリシー（コンテンツ・プライバシー・行動）を遵守していること
   - プライバシーポリシーページが存在すること
   - ナビゲーションが明確であること
6. 審査通過後、**パブリッシャー ID**（`ca-pub-XXXXXXXXXXXXXXXX`）が発行される

### 6-3. ads.txt の設定

`ads.txt` は広告枠の不正利用を防ぐための業界標準ファイル。AdSense では**必須**。

1. AdSense ダッシュボード → **サイト** → 該当サイト → **ads.txt のスニペットをコピー**
2. ファイル内容（例）:
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
3. **Vite SPA での配置**: `frontend/public/ads.txt` に配置
   - Vite のビルドで `public/` 内のファイルはルートにそのままコピーされる
   - `https://tsunaca.com/ads.txt` でアクセスできることを確認

### 6-4. AdSense スクリプト埋め込み

審査通過後、`index.html` の `<head>` にスクリプトを追加:

```html
<!-- frontend/index.html -->
<head>
  <!-- AdSense（本番のみ読み込み） -->
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
    crossorigin="anonymous"
  ></script>
</head>
```

**環境分岐**: ローカル開発では不要なため、環境変数で制御する:
```html
<!-- Vite の環境変数で制御する場合は、ビルド時に条件分岐するか、
     コンポーネント側で動的に script を挿入する -->
```

### 6-5. 広告ユニット作成

AdSense 管理画面で配置箇所ごとに広告ユニットを作成する。

1. **広告** → **広告ユニットごと** → **ディスプレイ広告** を選択
2. 各配置箇所に対応するユニットを作成:

| ユニット名（例）           | 配置箇所             | 広告タイプ   | サイズ       |
| -------------------------- | -------------------- | ------------ | ------------ |
| `tsunaca-home-top`         | ホーム画面上部       | ディスプレイ | レスポンシブ |
| `tsunaca-feed-inline-1`    | フィード内 #1        | インフィード | レスポンシブ |
| `tsunaca-community-detail` | コミュニティ詳細下部 | ディスプレイ | レスポンシブ |
| ...                        | 全15箇所分           | ...          | ...          |

3. 各ユニットの **`data-ad-slot`** ID をメモ → `adConfig.ts` の Ad Slot Registry に設定

> **ヒント**: 配置箇所ごとに別ユニットを作ると、**配置別の収益レポート**が取得できる

### 6-6. ローカル開発環境の設定

AdSense は `localhost` では動作しないため、環境変数 `VITE_AD_MODE` で広告の動作モードを切り替える。

> **重要: 二重実装にはならない。** `AdBanner` コンポーネントは**1つだけ実装**する。
> モードによって内部の表示処理が分岐するだけで、審査通過後にコードを書き直す必要はない。
> `.env` の値を `mock` → `production` に変更するだけで実広告に切り替わる。

```
AdBanner コンポーネント（実装は1つ）
├── VITE_AD_MODE=mock       → グレーのプレースホルダー表示（開発用）
├── VITE_AD_MODE=test       → AdSense 実広告 + テストフラグ（ステージング用）
└── VITE_AD_MODE=production → AdSense 実広告（本番）
```

#### A. モックモード（ローカル開発 — アカウント不要）

環境変数 `VITE_AD_MODE` で広告の動作を切り替える:

```bash
# frontend/.env.local
VITE_AD_MODE=mock          # mock | test | production
VITE_ADSENSE_CLIENT=       # ローカルでは空でOK
```

```typescript
// frontend/src/features/ads/AdBanner.tsx（抜粋）
const adMode = import.meta.env.VITE_AD_MODE

if (adMode === 'mock') {
  // グレーのプレースホルダーを表示（実際の広告リクエストなし）
  return (
    <div style={{
      background: '#f0f0f0',
      border: '1px dashed #ccc',
      padding: '16px',
      textAlign: 'center',
      color: '#999',
      fontSize: '12px',
    }}>
      📢 Ad Slot: {slotId} ({width}×{height})
    </div>
  )
}
```

これにより：
- ✅ AdSense アカウントなしで**レイアウト・表示条件・プラン制御**をすべてテスト可能
- ✅ 広告の配置位置やマージンの確認ができる
- ✅ ネットワークリクエストが発生しない（高速）

#### B. テストモード（ステージング環境 — アカウント必要）

ステージング環境（登録済みドメイン上）で、テスト広告を表示する:

```bash
# frontend/.env.staging
VITE_AD_MODE=test
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

```typescript
// テストモードでは data-adtest="on" を付与
if (adMode === 'test') {
  adElement.setAttribute('data-adtest', 'on')
}
```

`data-adtest="on"` の効果:
- ✅ 実際の広告がレンダリングされる（レイアウト確認）
- ✅ インプレッションは**テストとしてカウント**され、収益に影響しない
- ✅ 広告主に課金されない（ポリシー違反にならない）
- ❌ `localhost` では動作しない（登録ドメインが必要）

#### C. 本番モード

```bash
# frontend/.env.production
VITE_AD_MODE=production
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

### 6-7. 環境変数

| 変数名                | 説明                      | 値                             | 設定先            |
| --------------------- | ------------------------- | ------------------------------ | ----------------- |
| `VITE_AD_MODE`        | 広告動作モード            | `mock` / `test` / `production` | frontend `.env.*` |
| `VITE_ADSENSE_CLIENT` | AdSense パブリッシャー ID | `ca-pub-XXXXXXXXXXXXXXXX`      | frontend `.env.*` |

> **注意**: AdSense はフロントエンドのみのサービス。バックエンド環境変数は不要。
> パブリッシャー ID は公開情報（HTML に埋め込まれる）のため、シークレット管理不要。

---

## 7. 本番環境の Secrets Manager 設定

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

### Google AdSense（広告 — Web）
- [ ] AdSense アカウント作成（Google アカウントでサインアップ）
- [ ] 本番ドメインをサイト登録
- [ ] 審査リクエスト送信
- [ ] 審査通過確認（パブリッシャー ID `ca-pub-XXXX` 取得）
- [ ] `ads.txt` を `frontend/public/ads.txt` に配置
- [ ] 広告ユニット作成（全15箇所分）
- [ ] `index.html` に AdSense スクリプト追加
- [ ] `VITE_AD_MODE=mock` でローカル開発環境のモック表示確認
- [ ] ステージング環境で `data-adtest="on"` によるテスト広告表示確認

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
