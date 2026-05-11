# [8] BE ディレクトリ構成の評価/見直し

> 評価日: 2026-05-11
> 結論: **DDD 思想は明確で良好。ただしレイヤ間の整合性と命名揺れの是正が必要**

## 現状ディレクトリ構成

```
backend/src/
├── _bootstrap/              ← アプリ起動・DI 構成
├── _sharedTech/             ← 技術的共通モジュール
├── api/                     ← Web Adapter（Express）
│   ├── _usecaseFactory.ts   ← UseCase の DI コンテナ
│   ├── config/, types/
│   ├── front/               ← フロントエンド向け API
│   │   └── {feature}/
│   │       ├── routes/
│   │       ├── controllers/
│   │       └── service/
│   ├── webhook/             ← 外部 Webhook 受信（Stripe 等）
│   ├── integration/         ← 外部統合（Billing/RevenueCat 等）
│   ├── ws/                  ← WebSocket
│   ├── middleware/
│   └── schemas/             ← Zod バリデーション
├── application/             ← アプリケーション層
│   ├── _sharedApplication/  ← DTO, UnitOfWork など
│   └── {feature}/
│       ├── usecase/
│       └── error/
├── domains/                 ← ドメイン層
│   ├── _sharedDomains/      ← ValueObject, Enum 等
│   └── {feature}/
│       ├── domain/
│       │   ├── entity/
│       │   ├── repository/  ← Repository Interface
│       │   └── error/
│       └── infrastructure/
│           └── repository/  ← Prisma 実装
├── integration/             ← 外部サービス連携の Adapter
└── job/                     ← バッチ・Outbox ハンドラ
```

## 評価

### ✅ 良い点

1. **DDD レイヤ構造が明確**
   - `api/` (Adapter) → `application/` (UseCase) → `domains/` (Domain + Infrastructure)
2. **共通モジュールの prefix 統一**
   - `_sharedTech`, `_sharedApplication`, `_sharedDomains`
3. **Repository Interface と実装の分離**
   - `domain/repository/` (interface) と `infrastructure/repository/` (Prisma 実装)
4. **DI コンテナの存在**
   - `_usecaseFactory.ts` が DI を集約

### ⚠️ 改善が必要な点

#### 1. レイヤ間の feature 名が一致していない

| api/front/      | application/       | domains/              |
| --------------- | ------------------ | --------------------- |
| activity        | activity           | activity              |
| album           | album              | album                 |
| analytics       | analytics          | ❌ なし                |
| announcement    | announcement       | announcement          |
| auth            | auth               | auth                  |
| billing         | billing            | billing               |
| **channel**     | ❌ なし             | ❌ なし                |
| chat            | chat               | chat                  |
| community       | community          | community             |
| connect         | connect            | ❌ なし（billing内？） |
| **deviceToken** | ❌                  | ❌                     |
| dm              | ❌                  | ❌                     |
| expense         | expense            | expense               |
| **export**      | analytics に統合？ | —                     |
| **help**        | ❌                  | ❌                     |
| **inquiry**     | ❌                  | ❌                     |
| matching        | matching           | ❌                     |
| master          | ❌                  | ❌                     |
| notification    | ❌                  | ❌                     |
| participation   | participation      | ❌（activity 内？）    |
| place           | place              | place                 |
| poll            | poll               | poll                  |
| schedule        | schedule           | （activity 内？）     |
| stamp           | ❌                  | ❌                     |
| upload          | ❌                  | ❌                     |
| user            | user               | user                  |
| user-schedule   | ❌                  | ❌                     |
| webhook         | webhook            | webhook               |

→ `api/front/` と `application/` / `domains/` で feature 粒度が揃っていない。

#### 2. ケース揺れ
- `deviceToken` (camelCase) と `user-schedule` (kebab-case) が混在 → `device-token` or `deviceToken` に統一
- `master`（モジュール名）と `*Master`（モデル名）の関係が不明瞭

#### 3. Controller / Routes / Service の責務曖昧
`api/front/{feature}/` 内の `controllers` と `service` の使い分けが feature ごとに揺れている：
- 一部 feature は `controllers/` に Prisma 直叩きロジック
- 一部 feature は `service/` で UseCase ラッパー
- → 統一されたガイドラインが必要

#### 4. `webhook` 受信と `webhook` 設定の混同
- `api/front/webhook/` = コミュニティの Webhook **設定** API
- `api/webhook/stripe/` = Stripe Webhook **受信** エンドポイント
- → 命名で衝突。例: `api/webhook-receive/` vs `api/front/webhook-config/`

#### 5. 1 機能で複数 routes ファイルが乱立
`api/front/community/routes/` には:
- communityRoutes.ts
- communityLocationRoutes.ts
- communityTagRoutes.ts
- bookmarkRoutes.ts
- connectRoutes.ts
- inviteRoutes.ts
- membershipRoutes.ts

→ feature が肥大化したら sub-feature に分離する設計指針が欲しい。

## 推奨アプローチ

### A. レイヤ間の feature 統一（最重要）

各 feature が `api/`, `application/`, `domains/` に **同じディレクトリ名** で存在することを目指す。

ただし、以下のような割り切りは許容：
- `analytics`, `export` は **Read Model 系** → `domains/` に置かない（[6] 参照）
- `master` は API 集約のための便宜上のグルーピング → 各マスタは個別 feature に分散する

### B. ケース統一
- すべて **camelCase** に統一（`device-token` → `deviceToken`、`user-schedule` → `userSchedule`）
- もしくは **kebab-case** に統一
- → 現状の主流は camelCase なので camelCase 推奨

### C. Controller/Service の責務定義（規約化）

**Controller**: HTTP リクエストの受け取り・レスポンス返却・UseCase 呼び出しのみ
**Service**: 複数 UseCase の組み合わせやキャッシュ等の cross-cutting 処理（**Prisma 禁止**）

→ DDD 違反対応 [6] と同時に進める

### D. `webhook` の命名整理
- `api/front/webhook-config/` — コミュニティの Webhook 設定
- `api/integration-webhook/stripe/` — 外部 Webhook 受信（or `api/webhook-receive/stripe/`）

### E. sub-feature の独立条件を規約化
1 feature 内の routes ファイルが **3 個以上** または **総コード量が 500 行超** になったら、独立 feature に切り出す（例: `community/connect/` → `connect/`）。

### F. ドキュメント

`backend/src/README.md` に：
- レイヤ責務一覧
- ディレクトリ命名規則
- feature 分離の判断基準

を明文化する。

## 優先度

🟡 **Medium** — 機能開発と並行できるリファクタリング。一気に変えるより、新規/既存変更の都度ガイドラインに沿わせる戦略が現実的。

## 関連項目
- [6] DDD 違反（Controller/Service の責務定義とセット）
- [9] RESTful 評価（API 整理と統合可能）
