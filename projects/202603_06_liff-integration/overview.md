# LIFF（LINE Mini App）統合 — 案件概要

> **作成日**: 2026-03-06
> **ステータス**: 🔲 未着手
> **ゴール**: LIFF 内での全機能動作確認（Web 版と同等の機能を LINE アプリ内 WebView で完全動作させる）
> **前提条件**: frontend-reform（Web 版）の全機能完了
> **優先度**: 🥇 最優先（ネイティブアプリよりも先行）

---

## 案件スコープ

LINE Front-end Framework（LIFF）を導入し、LINE アプリ内 WebView で Schedy の全機能を動作させる。
LIFF Browser 固有の制約（Cookie クロスサイト問題）に対応し、既存の Ports/Adapters アーキテクチャを活用して認証・ストレージを切り替える。

---

## 主要タスク（概要）

### 1. LIFF SDK 導入 + 初期化

- `@line/liff` パッケージ導入
- `liff.init({ liffId })` の実装
- LIFF アプリ登録（LINE Developers Console）
- 環境変数管理（LIFF ID）

### 2. 認証フロー実装

- `LiffAuthTokenAdapter` 実装（`IAuthTokenPort` の LIFF 用アダプター）
  - `liff.getAccessToken()` で LINE アクセストークン取得
  - BE に送信 → LINE Login API で検証 → 自前 JWT 発行
- プラットフォーム検出の変更: `Capacitor.isNativePlatform()` → `liff.isInClient()` 分岐
- BE: LINE Login 検証 → ユーザー紐付け/新規作成 API

### 3. LINE Login ↔ パスワード認証のアカウント連携

- 既存パスワード認証ユーザーと LINE アカウントの紐付け API（BE）
- 初回 LIFF アクセス時のアカウント連携/新規登録フロー（FE）

### 4. LIFF Browser 全画面動作検証

- Cookie 非送信環境での Bearer フォールバック動作確認
- 全画面・全機能の LIFF Browser 内動作テスト
- デバッグ・修正

### 5. LINE 共有機能

- `liff.shareTargetPicker()` による招待・アナウンス共有
- 既存 `navigator.share` との抽象化・切り替え

---

## 技術的前提（実装済み基盤）

| 基盤                                                  | 状態       | 詳細                                                         |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| BE 認証ミドルウェア（Cookie → Bearer フォールバック） | ✅ 実装済み | `req.cookies.token` → `req.headers.authorization` の順で検証 |
| BE ログインレスポンスにトークン返却                   | ✅ 実装済み | Cookie 設定 + レスポンスボディに `accessToken` 返却          |
| `IAuthTokenPort` インターフェース                     | ✅ 設計済み | Ports/Adapters パターンで抽象化済み                          |
| `WebAuthTokenAdapter`                                 | ✅ 実装済み | Cookie 方式                                                  |
| `CapAuthTokenAdapter`                                 | ✅ 実装済み | Capacitor 用（Bearer 方式の参考実装として流用可）            |

---

## 技術メモ

- **LIFF Browser の Cookie 制約**: LIFF Browser 内では WebView がクロスサイト扱いになり、`SameSite=Lax` だと Cookie が送信されない → Bearer ヘッダー方式で回避（`frontend/auth-token-strategy.md` 参照）
- **アダプター流用**: 既存 `CapAuthTokenAdapter` の Bearer ヘッダー送信ロジックを `LiffAuthTokenAdapter` で流用可能。トークン取得元のみ変更（`@capacitor/preferences` → `liff.getAccessToken()`）
- **LINE Developers Console**: LIFF アプリの登録・LIFF ID 取得が必要。エンドポイント URL は Web 版と同一
- **LINE Login API**: `https://api.line.me/oauth2/v2.1/verify` でアクセストークン検証。プロフィール取得は `https://api.line.me/v2/profile`

---

## 依存関係

```
frontend-reform（Web版）全機能完了
  └── LIFF 統合
       ├── LIFF SDK 初期化
       ├── LiffAuthTokenAdapter 実装
       ├── LINE Login 検証 API（BE）
       ├── アカウント連携 API（BE）
       ├── 全画面動作検証
       └── LINE 共有機能
```

---

## 作業ログ

- 2026-03-06: 案件作成。Capacitor 撤廃に伴い、LIFF 統合を独立案件として切り出し。最優先案件として位置づけ
