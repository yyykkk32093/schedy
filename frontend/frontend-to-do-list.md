# フロントエンド ToDo リスト

## 📌 現在のスコープ（v1: 認証画面 & メインメニュー）

- [x] ディレクトリ構成（Feature-based + Ports/Adapters）
- [x] shadcn/ui 初期化
- [x] Capacitor 初期化（`capacitor.config.ts`）
- [x] バックエンド httpOnly Cookie 対応
- [x] 認証ミドルウェア（Cookie + Bearer ハイブリッド）
- [x] ログアウトエンドポイント
- [x] API通信層（axios + withCredentials）
- [x] Ports/Adapters 基盤（IAuthTokenPort, IStoragePort）
- [x] Web用アダプター実装
- [x] ログイン画面（パスワード + OAuth）
- [x] サインアップ画面
- [x] OAuthコールバック画面
- [x] メインメニュー画面（プレースホルダー）
- [x] ProtectedRoute（未認証リダイレクト）

---

## 🔜 次フェーズ: LIFF / LINE Mini App 統合

> LINE社は2025年にLIFFをLINE Mini Appに統合する方針を発表。  
> 新規開発はLINE Mini Appとして作ることが推奨されている。

### タスク

- [ ] LINE Developers Console でチャネル作成 & LIFF ID取得
- [ ] `@line/liff` パッケージインストール
- [ ] `liff.init()` をアプリ起動時に組み込み（`main.tsx` or `PlatformProvider`）
- [ ] `liff.isInClient()` でLINE内/外部ブラウザの判定ロジック追加
- [ ] LIFF用 `AuthTokenAdapter` 実装（`liff.getAccessToken()` or `liff.getIDToken()` + Bearer ヘッダー）
- [ ] LIFF Browser固有のUI調整（戻るボタン、画面サイズ等）
- [ ] LINE Mini App への移行検討（LIFF → LINE Mini App統合に伴う対応）
  - LINE Mini App固有のポリシー・UI要件の確認
  - サービスメッセージ連携（予定リマインド等）
- [ ] ngrok 等でHTTPSトンネル構築（LIFF開発用）
- [ ] LIFF Inspector でデバッグ環境構築

### 参考

- LIFF公式ドキュメント: https://developers.line.biz/ja/docs/liff/
- LINE Mini App: https://developers.line.biz/ja/docs/line-mini-app/

---

## 🔜 次フェーズ: Capacitor iOS / Android ビルド

> Capacitorは既にプロジェクトに組み込み済み（`capacitor.config.ts`）。  
> `npx cap add ios` / `npx cap add android` でネイティブプロジェクトを生成する。  
> **ソースコードはWebと完全に同一** — ビルド済みWebアセット（`dist/`）をWebViewで実行する。

### タスク

- [ ] `npx cap add ios` 実行（Xcode + CocoaPods必要）
- [ ] `npx cap add android` 実行（Android Studio必要）
- [ ] Capacitor用アダプター実装の実機テスト
  - `@capacitor/preferences`（Secure Storage）
  - `@capacitor/app`（ディープリンク）
- [ ] iOS: WKWebView でのCookie動作確認
- [ ] Android: WebViewでのCookie動作確認
- [ ] iOS: App Store Connect 設定 & TestFlight 配信
- [ ] Android: Google Play Console 設定 & 内部テスト配信
- [ ] プッシュ通知対応（`@capacitor/push-notifications`）
- [ ] アプリアイコン & スプラッシュスクリーン設定
- [ ] CapacitorConfig の `server.url` 設定（ライブリロード用）

### 参考

- Capacitor公式: https://capacitorjs.com/docs
- Capacitor + Vite: https://capacitorjs.com/docs/getting-started/with-web

---

## 🔮 将来フェーズ: React Native 移行

> ストア配布アプリは将来的にReact Nativeで作成し、ネイティブ体験を向上させる。  
> 現在のPorts/Adaptersパターンにより、`core/` 層（ビジネスロジック, API通信, 型定義, カスタムHooks）は  
> React Nativeプロジェクトに**そのまま移植可能**な設計としている。

### 移行戦略

1. `core/` をmonorepoの共有パッケージとして切り出し
2. React Nativeプロジェクトを別パッケージとして作成
3. `core/` を再利用し、UIコンポーネント（`<View>`, `<Text>`等）とRN用アダプターのみ新規開発
4. 並行運用 → 段階的にCapacitor版を廃止

### 再利用可能な部分（推定 70-80%）

- API呼び出しロジック（axios / fetch）
- 状態管理ロジック
- バリデーションルール（zod スキーマ）
- 型定義（TypeScript DTO, Enum）
- カスタムHooks（非UI）
- Port インターフェース定義

### 書き直しが必要な部分（推定 20-30%）

- UIコンポーネント（HTML/CSS → `<View>`, `<Text>`, `StyleSheet`）
- CSS / Tailwind → StyleSheet or NativeWind
- react-router-dom → react-navigation
- Capacitorプラグイン → React Native向けライブラリ
- アダプター実装（RN用を新規作成）

### `core/` ディレクトリのルール

**以下のimportを禁止する（RN移行を保証するため）:**
- `react-dom`
- `@capacitor/*`
- `document.*`, `window.*`（DOM API）
- ブラウザ固有API

---

## 🔜 次フェーズ: Activity（予定管理）機能

> バックエンドの Activity ドメイン（`backend/src/domains/schedule/activity/`）は  
> UseCase + DTO が存在するがAPIエンドポイントは未実装。

### タスク

- [ ] バックエンド: Activity API エンドポイント実装（CRUD）
- [ ] フロントエンド: `features/schedule/` の実装
  - 予定一覧画面
  - 予定作成画面
  - 予定詳細画面
  - 予定編集・キャンセル画面
