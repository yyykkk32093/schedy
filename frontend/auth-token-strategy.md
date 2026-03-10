# 認証トークン管理戦略

## 概要

本プロジェクトの認証トークン（JWT）管理方式の比較検討と選定結果をまとめる。

---

## localStorage vs httpOnly Cookie 比較

### localStorage

**仕組み**: ブラウザの Web Storage API。JavaScript（`window.localStorage`）で値を読み書きする。

| 観点              | 詳細                                            |
| ----------------- | ----------------------------------------------- |
| **実装難易度**    | ◎ 非常にシンプル                                |
| **XSS耐性**       | ✗ 脆弱 — 同一オリジンの任意のJSからアクセス可能 |
| **CSRF耐性**      | ◎ ブラウザが自動送信しないため心配不要          |
| **WebView互換性** | ◎ Capacitor / LIFF で問題なく動作               |

**XSS脆弱性の詳細**:
- XSS攻撃が成功した場合、`localStorage.getItem('token')` でトークンを**窃取可能**
- サードパーティライブラリ（npmパッケージ）経由のサプライチェーン攻撃も脅威
- 窃取されたトークンは攻撃者のサーバーに送信され、**セッションを完全に乗っ取れる**

### httpOnly Cookie

**仕組み**: サーバーが `Set-Cookie` レスポンスヘッダーでブラウザにCookieを設定。以降のリクエストでブラウザが自動送信する。

| 観点              | 詳細                                                            |
| ----------------- | --------------------------------------------------------------- |
| **実装難易度**    | △ サーバー側の設定が必要（CORS, cookie-parser等）               |
| **XSS耐性**       | ◎ `HttpOnly`フラグにより`document.cookie`からの読み取りが不可能 |
| **CSRF耐性**      | △ 対策必要（`SameSite`属性 + 必要に応じてCSRFトークン）         |
| **WebView互換性** | △ 環境によりCookieの挙動が不安定な場合あり                      |

**XSSに対する耐性の詳細**:
- `HttpOnly`フラグにより、JavaScriptから`document.cookie`でトークンを**読み取れない**
- XSSが成功してもトークン自体の窃取は不可能
- ただし、XSSが存在する限り攻撃者は被害者のブラウザ上からAPI呼び出しを行える（Session Riding）

---

## Cookie 属性の説明

### HttpOnly

Cookie に付与するセキュリティフラグ。

```
Set-Cookie: token=abc123; HttpOnly
```

- このフラグがあると、JavaScript（`document.cookie`）から Cookie を**読み取れなくなる**
- XSS攻撃によるトークン窃取を防ぐための重要な属性
- **ライブラリ名ではなく、ブラウザのCookieに付けられるセキュリティ属性（フラグ）**

### Secure

```
Set-Cookie: token=abc123; Secure
```

- HTTPS通信時のみCookieが送信される属性
- HTTP（暗号化なし）では送信されないため、通信経路での盗聴を防ぐ
- ローカル開発（`localhost`）ではHTTPでも送信される（ブラウザの例外処理）

### SameSite

```
Set-Cookie: token=abc123; SameSite=Lax
```

**別サイト（クロスサイト）からのリクエスト時にCookieを送るかどうか**を制御する属性。  
CSRF（Cross-Site Request Forgery / クロスサイトリクエストフォージェリ）攻撃への対策。

| 値       | 動作                                                                | ユースケース                                                                  |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Strict` | 同一サイトからのリクエスト**のみ**Cookie送信                        | 最も安全。ただし外部リンクからアクセスするとログアウト状態になる              |
| `Lax`    | 同一サイト + トップレベルナビゲーション（リンククリック等）時に送信 | **一般的なWebアプリに推奨**。通常のブラウジングでは問題なくCookieが送信される |
| `None`   | 常に送信（ただし`Secure`属性が必須）                                | クロスサイト通信が必要な場合のみ。セキュリティが最も弱い                      |

### LIFF Browser（LINE内WebView）での注意点

- LIFF Browser内ではWebViewが**クロスサイト扱い**になる場合がある
- `SameSite=Lax` だとCookieが送信されないケースが存在する
- → LIFF環境ではBearerヘッダー方式をフォールバックとして使用する（ハイブリッド方式）

---

## 選定結果: ハイブリッド方式

### 環境別トークン管理方式

| 環境                      | トークン管理方式                                      | 理由                          |
| ------------------------- | ----------------------------------------------------- | ----------------------------- |
| **Web Browser**           | httpOnly Cookie（サーバーが設定・ブラウザが自動送信） | XSSに対する最高のセキュリティ |
| **Capacitor（WebView）**  | Secure Storage + `Authorization: Bearer` ヘッダー     | WebViewのCookie制約を回避     |
| **LIFF（LINE内WebView）** | `Authorization: Bearer` ヘッダー（将来対応）          | クロスサイト制約を回避        |

### サーバー側の実装方針

1. **ログイン成功時**: httpOnly Cookie設定 **+** レスポンスボディにも`accessToken`返却
   - Web: Cookieを使い、bodyのtokenは無視
   - Capacitor/LIFF: bodyのtokenを使い、Secure Storageに保存

2. **認証ミドルウェア**: Cookie → Authorization Bearer の順でトークンを探す
   ```
   1. req.cookies.token を確認
   2. なければ req.headers.authorization から Bearer token を取得
   3. どちらもなければ 401 UNAUTHORIZED
   ```

3. **ログアウト**: Cookieクリア + フロントエンド側でSecure Storage/stateをクリア

### フロントエンド側の実装方針（Ports/Adapters パターン）

```
IAuthTokenPort（インターフェース）
├── WebAuthTokenAdapter    — Cookie方式（フロント側はほぼ透過的）
├── CapAuthTokenAdapter    — @capacitor/preferences + Bearer ヘッダー
└── (将来) LiffAuthTokenAdapter  — liff.getAccessToken() + Bearer ヘッダー
```

- `IAuthTokenPort` インターフェースでトークン管理を抽象化
- プラットフォーム検出（`Capacitor.isNativePlatform()`等）により実行時にアダプターを切替
- UIコンポーネントやビジネスロジックはポートにのみ依存し、プラットフォーム固有コードは不要
