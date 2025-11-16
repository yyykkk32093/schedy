# 🧭 Backend Architecture Note  
## なぜ API 層を分離したのか

---

## 🎯 背景

当初は、フロントエンド（React）とドメイン層を同一パッケージに配置し、  
以下のように **UI → UseCase → Domain** の直接呼び出し構造を目指していた。

```
UI(React)
  ↓
Application(UseCase)
  ↓
Domain(Entity, ValueObject)
```

これはクリーンアーキテクチャ／DDD（Domain Driven Design）の依存方向原則に忠実で、  
UI層がドメイン層に依存しても逆方向の依存が発生しない理想的な構造だった。

---

## ⚠️ 課題（実行環境制約）

React はブラウザ上で動作するため、以下のような制約が存在する。

| 種別 | 内容 |
|------|------|
| 🧩 Node依存ライブラリ不可 | bcrypt, fs, path, crypto など Node.js 標準機能がブラウザで使用不可 |
| ⚙️ モジュール構成の不一致 | React（Vite）の ESM 環境ではサーバー側 TypeScript ファイルを直接 import できない |
| 🔐 セキュリティ上の問題 | ドメインロジック（UseCase, Entity）をブラウザに置くと内部実装が露出する |
| 💾 インフラ層の実行不可 | Repository 実装は DB・外部API を前提にしており、ブラウザでは動作しない |

結果として、
> UI が直接 UseCase を呼び出す構成は「論理的には正しいが、実行環境として成立しない」

という結論に至った。

---

## 🧱 解決方針（API 層の導入）

この課題を解消するため、**UI とドメイン層の間に API 層（Express）**を新設した。

```
[Frontend] React
    ↓ HTTP通信（fetch / axios）
[Backend] Express API
    ↓
[Application] UseCase
    ↓
[Domain] Entity / ValueObject
```

### API 層の主な責務

| 項目 | 役割 |
|------|------|
| 🌐 通信の橋渡し | フロントエンドとバックエンドを HTTP 経由で疎結合に接続 |
| 🔒 セキュリティ担保 | 認証・認可、バリデーション、例外処理の集中管理 |
| ⚙️ 責務分離 | UI 層を入出力処理に限定し、ドメインロジックはサーバー側で完結 |
| 🔄 バージョン管理 | `/v1/auth/password` のような RESTful バージョニングを適用可能 |

---

## ✅ 現行構成の特徴

| 層 | 役割 |
|----|------|
| **frontend** | React による表示・API呼び出しを担当 |
| **backend** | Express による API 提供と UseCase 呼び出しを担当 |
| **sharedDomains** | 共通の ValueObject / DTO / Enum を配置し、型整合性を担保 |

この構成により：
- 実装上も **DDD の依存方向（UI → Application → Domain）** を維持  
- 実行上も **ブラウザとサーバーの責務分離** を実現  

---

## 📘 まとめ

| 項目 | 旧構成（UI直呼び） | 新構成（API分離） |
|------|--------------------|------------------|
| 呼び出し経路 | UI → UseCase | UI → API → UseCase |
| 実行環境 | ブラウザ | サーバー |
| 問題点 | Node依存不可、セキュリティリスク | API経由で解消 |
| DDD整合性 | 概念上◯ 実行上× | 概念・実行ともに◯ |
| 特徴 | 単純構成だが制約多 | 拡張性・安全性・現実性を両立 |

---

## 🗒 教訓

> 「クリーンアーキテクチャの原則を現実の実行環境でどう成立させるか」  
> という課題に対する、実務的な折衷案が **API 層の導入** である。

---

### 🧩 備考
- Express は Tomcat や Spring Boot の「アプリケーションサーバー層」に相当する。  
- React は「プレゼンテーション層（View）」であり、バックエンドロジックを持たない。  
- API 層を介することで、**認証／認可／非同期処理／ログ集約** などを共通化できる。

---

API起動：

backend % npx tsc -p tsconfig.server.json
backend % NODE_ENV=local node dist/api/server.js

ローカルDB起動：
brew services start postgresql@14