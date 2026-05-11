# [6] DDD レイヤ違反の整理

> 評価日: 2026-05-11
> 結論: **対応必須。Router/Controller/Middleware/UseCase の各レイヤで Prisma 直叩きが多数存在**

## 現状調査

DDD のルールでは Router/Controller は UseCase のみ呼び、UseCase は Repository（Domain 層 Interface） 経由でデータアクセスする。Prisma 直接利用は **Domain/Infrastructure 層** に閉じ込められるべき。

### 違反サマリ

| レイヤ                                 | 違反ファイル数 | 重大度   |
| -------------------------------------- | -------------- | -------- |
| Router (`api/front/*/routes`)          | 6+             | 🔴 High   |
| Controller (`api/front/*/controllers`) | 5+             | 🔴 High   |
| Middleware (`api/middleware`)          | 2              | 🔴 High   |
| UseCase (`application/*/usecase`)      | 10+            | 🟠 Medium |

---

## 1. Router 層の Prisma 直叩き

| ファイル                                                                                                    | 内容                                                           |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [stampRoutes.ts](../../../backend/src/api/front/stamp/routes/stampRoutes.ts#L21)                            | `prisma.stamp.*` 5+ 箇所（create / findMany / delete）         |
| [uploadRoutes.ts](../../../backend/src/api/front/upload/routes/uploadRoutes.ts#L156)                        | `prisma.message.findUnique`, `prisma.messageAttachment.create` |
| [communityLocationRoutes.ts](../../../backend/src/api/front/community/routes/communityLocationRoutes.ts#L7) | prisma 直接 import                                             |
| [communityTagRoutes.ts](../../../backend/src/api/front/community/routes/communityTagRoutes.ts#L7)           | prisma 直接 import                                             |
| [bookmarkRoutes.ts](../../../backend/src/api/front/community/routes/bookmarkRoutes.ts#L1)                   | prisma 直接 import                                             |
| [notificationRoutes.ts](../../../backend/src/api/front/notification/routes/notificationRoutes.ts#L1)        | prisma 直接 import                                             |

## 2. Controller 層の Prisma 直叩き

| ファイル                                                                                            | 内容                                                                     |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [helpController.ts](../../../backend/src/api/front/help/controllers/helpController.ts#L34)          | `prisma.helpFeedback.*` 15+ 箇所（upsert / create / groupBy / findMany） |
| [inquiryController.ts](../../../backend/src/api/front/inquiry/controllers/inquiryController.ts#L61) | `prisma.inquiryCategory/inquiry/inquiryMessage.*` 50+ 箇所               |
| [masterController.ts](../../../backend/src/api/front/master/controllers/masterController.ts#L7)     | `prisma.categoryMaster.*`, `prisma.participationLevelMaster.*`           |
| [chatController.ts](../../../backend/src/api/front/chat/controllers/chatController.ts#L16)          | membership / activity への直クエリ                                       |
| [userController.ts](../../../backend/src/api/front/user/controllers/userController.ts#L84)          | `prisma.user.findUnique/update`                                          |

> Help/Inquiry はソース上に「Wave6 Phase 8-B 暫定実装… 後続で UseCase/Repository に分離する」のコメントあり。

## 3. Middleware 層の Prisma 直叩き

| ファイル                                                                                     | 内容                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [featureGateMiddleware.ts](../../../backend/src/api/middleware/featureGateMiddleware.ts#L21) | `user/stamp/community/schedule/participation` への直クエリ |
| [requireSystemAdmin.ts](../../../backend/src/api/middleware/requireSystemAdmin.ts#L28)       | `prisma.user.findUnique`                                   |

→ Middleware は cross-cutting なので、**Repository 経由の薄いサービス**を導入して呼ぶ形が望ましい。

## 4. UseCase 層が `PrismaClient` を直接 inject

| ファイル                                                                                                                             | 内容                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| [ExportCalendarUseCase.ts](../../../backend/src/application/analytics/usecase/ExportCalendarUseCase.ts#L1)                           | `prisma.participation.findMany`         |
| [ExportParticipationCsvUseCase.ts](../../../backend/src/application/analytics/usecase/ExportParticipationCsvUseCase.ts#L1)           | participation/payment/user に直アクセス |
| [GetParticipationTrendUseCase.ts](../../../backend/src/application/analytics/usecase/GetParticipationTrendUseCase.ts#L1)             | activity 直クエリ                       |
| [GetCommunityStatsUseCase.ts](../../../backend/src/application/analytics/usecase/GetCommunityStatsUseCase.ts#L1)                     | 複数モデル直クエリ                      |
| [GetAbsenceReportUseCase.ts](../../../backend/src/application/analytics/usecase/GetAbsenceReportUseCase.ts#L1)                       | participationAuditLog/user 直クエリ     |
| [ExportAccountingUseCase.ts](../../../backend/src/application/analytics/usecase/ExportAccountingUseCase.ts#L1)                       | schedule 直クエリ                       |
| [ListAvailablePlansUseCase.ts](../../../backend/src/application/billing/usecase/ListAvailablePlansUseCase.ts#L1)                     | planMaster 直クエリ                     |
| [ListPaymentHistoryUseCase.ts](../../../backend/src/application/participation/usecase/ListPaymentHistoryUseCase.ts#L3)               | schedule/payment 直クエリ               |
| [CancelParticipationUseCase.ts](../../../backend/src/application/participation/usecase/CancelParticipationUseCase.ts#L23)            | 12+ 直アクセス                          |
| [ListRefundPendingPaymentsUseCase.ts](../../../backend/src/application/participation/usecase/ListRefundPendingPaymentsUseCase.ts#L3) | prisma 直 inject                        |

> Analytics 系は集計クエリの性能要件があり、Repository に隔離するか Read Model 専用層を切るか議論必要。

---

## 評価

### 違反パターン分類

| パターン                      | 該当                              | 推奨対応                                                                  |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| **A. 暫定実装が放置**         | Help, Inquiry                     | コメント通り Repository に分離                                            |
| **B. 集計系のショートカット** | Analytics 群                      | Read Model / QueryService として正規化（Repository とは別レイヤを認める） |
| **C. CRUD だけだから直接**    | stamp/upload/communityLocation 等 | Repository を作る（ボリューム小）                                         |
| **D. middleware の特殊事情**  | featureGate / requireSystemAdmin  | Cache 層付きの軽量サービスを切る                                          |

### Read Model パターンの提案
集計系（Analytics）は無理に Repository に押し込むと逆に複雑化するため、以下のいずれかを採用：
- **Query Service レイヤ**（CQRS の Q 側）を `application/_query/` に作成
- Prisma を直接利用してよいレイヤとして明示し、コーディング規約に追加

## 推奨アプローチ

### 進め方（段階的）

#### Phase 1: 既存パターンの拡張
- [_usecaseFactory.ts](../../../backend/src/api/_usecaseFactory.ts) に存在する Repository DI パターンを未対応モジュールに展開
- 影響範囲が小さい順に対応：`stampRoutes` → `notificationRoutes` → `bookmarkRoutes` → `communityTagRoutes` / `communityLocationRoutes`

#### Phase 2: Help / Inquiry の本実装化
- ソース内の TODO コメントを解消
- Repository / UseCase / Controller の三層に分離

#### Phase 3: Middleware の整理
- `FeatureGateService` を新設（Cache 層付き）
- `requireSystemAdmin` も同サービスから利用

#### Phase 4: Analytics の方針決定
- Read Model パターン採用 or Repository に集約 を意思決定
- 採用方針に沿って Analytics UseCase 群を書き換え

### コーディング規約への追記
- "Router / Controller / Middleware で Prisma を import 禁止"
- Lint で検出（例: `eslint-plugin-import` の `no-restricted-imports`）

```js
// .eslintrc 抜粋例
{
  "files": ["src/api/**/*.ts", "!src/api/_usecaseFactory.ts"],
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["@prisma/client", "../**/prisma"]
    }]
  }
}
```

## 優先度

🔴 **High** — DDD 設計の根幹。今後の機能追加で違反が増殖しないよう、**Lint で防御** + **既存違反を計画的に解消**。

## 関連項目
- [5] 未使用テーブル・コード調査（UseCase 単位での未使用検出）
- [8] ディレクトリ構成（DDD 違反の発生源を構造的に潰す）
- [9] RESTful 評価（Controller の整理と並行可能）
