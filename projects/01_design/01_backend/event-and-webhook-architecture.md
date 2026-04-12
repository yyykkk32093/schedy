# イベント駆動設計と Webhook — 統一的な理解ガイド

> **最終更新**: 2026-04-11

本プロジェクトには「何かが起きたら、それに応じて何かする」パターンが **3つ** ある。  
これらは表面上異なるが、**すべて同じ「イベント駆動」の考え方**に基づいている。

---

## 全体像

```
┌───────────────────────────────────────────────────────────┐
│                   あなたのサーバー                          │
│                                                           │
│  ┌─────────────┐    DomainEventBus     ┌──────────────┐  │
│  │ AggregateRoot│ ──────────────────→  │ Subscriber   │  │
│  │ (イベント蓄積) │    ① ドメインイベント   │ (内部処理)    │  │
│  └─────────────┘                       └──────┬───────┘  │
│                                                │          │
│                                     ┌──────────▼───────┐  │
│                                     │ Outbox テーブル    │  │
│                                     │ ② 統合イベント     │  │
│                                     └──────────┬───────┘  │
│                                                │          │
│  ┌─────────────┐                    ┌──────────▼───────┐  │
│  │ Webhook      │                    │ OutboxWorker     │  │
│  │ Controller   │                    │ (Job)            │  │
│  │ ③ 外部イベント │                    └──────────────────┘  │
│  └──────┬──────┘                                          │
│         │                                                 │
└─────────│─────────────────────────────────────────────────┘
          │
    HTTP POST（インターネット経由）
          │
┌─────────▼──────────┐
│  外部サービス        │
│  (Stripe など)      │
└────────────────────┘
```

---

## 3つのパターン比較

| 観点                 | ① ドメインイベント           | ② 統合イベント (Outbox)               | ③ Webhook                      |
| -------------------- | ---------------------------- | ------------------------------------- | ------------------------------ |
| **一言で**           | 同じプロセス内の通知         | 境界を越える非同期通知                | 外部サービスからの通知         |
| **発行者**           | AggregateRoot                | Subscriber → Outbox                   | 外部サービス (Stripe)          |
| **受信者**           | Subscriber (同プロセス)      | IntegrationHandler (Job)              | Webhook Controller             |
| **通信手段**         | メモリ内の関数呼び出し       | DB (Outbox テーブル) → Job ポーリング | HTTP POST                      |
| **トランザクション** | UseCase のトランザクション内 | DB書き込みと同一トランザクション      | 独立（署名検証で信頼担保）     |
| **信頼性担保**       | 同期実行なので確実           | リトライ + DLQ                        | Stripe 側がリトライ + 署名検証 |
| **例**               | `PasswordUserLoggedInEvent`  | Audit ログ送信、Push 通知             | `payment_intent.succeeded`     |

---

## ① ドメインイベント — 同じプロセス内の通知

**「何が起きたか」をドメインモデルが宣言し、同プロセス内の関心者に伝える。**

```
UseCase.execute()
  │
  │  user.addDomainEvent(new PasswordUserLoggedInEvent(user))
  │                          ↑ エンティティがイベントを蓄積（まだ発火しない）
  │
  │  await eventPublisher.publishAll(user.pullDomainEvents())
  │                          ↑ UseCase が蓄積イベントを一括発火
  │
  ▼
DomainEventBus.publish(event)
  │
  ├→ PasswordUserLoggedInSubscriber.handle()   … ドメイン内部の副作用
  └→ PublishAuthIntegrationSubscriber.handle() … ② Outbox へ橋渡し
```

**特徴**:
- すべてメモリ内。HTTP もDB I/O も（Outbox保存を除き）発生しない
- UseCase のトランザクション内で同期実行される
- 「Producer（エンティティ）は Consumer（Subscriber）の存在を知らない」= 疎結合

---

## ② 統合イベント (Outbox) — 境界を越える非同期通知

**「ドメイン内で起きたことを、外部システムや他の境界コンテキストに確実に届ける。」**

```
PublishAuthIntegrationSubscriber.handle(event)
  │
  │  DomainEvent → IntegrationEvent に変換
  │  OutboxRepository.save(outboxEvent)    ← UseCase トランザクションと同一DB書き込み
  │
  ▼
OutboxWorker.runOnce()                     ← Job が定期ポーリング
  │
  │  outboxRepo.findPending()
  │  dispatcher.dispatch(routingKey, event)
  │
  ▼
IntegrationHandler.handle()                ← 実際の配信（HTTP/Push/Kafkaなど）
```

**特徴**:
- **Transactional Outbox パターン**: ドメイン操作と Outbox 書き込みを同一トランザクションで行うことで「イベントの取りこぼし」を防止
- リトライ（指数バックオフ）+ DLQ（Dead Letter Queue）で信頼性担保
- `routingKey` で配信先を振り分け（`audit.log`, `notification.push` など）

---

## ③ Webhook — 外部サービスからの通知

**「外部サービスが、HTTP POST であなたのサーバーにイベントを送ってくる。」**

```
Stripe（外部）
  │
  │  HTTP POST /v1/webhooks/stripe
  │  Header: stripe-signature: t=...,v1=...
  │  Body: { "type": "payment_intent.succeeded", "data": { ... } }
  │
  ▼
stripeWebhookController.handleWebhook()
  │
  │  1. 署名検証（STRIPE_WEBHOOK_SECRET で改ざんチェック）
  │  2. event.type で分岐
  │
  ├→ payment_intent.succeeded → HandleStripePaymentSucceededUseCase
  ├→ charge.refunded          → HandleStripeRefundCompletedUseCase
  └→ account.updated          → HandleStripeAccountUpdatedUseCase
```

**特徴**:
- **あなたはサーバーを公開するだけ**。発火タイミングは Stripe が決める
- 署名検証で「本当に Stripe から来たリクエストか」を確認（なりすまし防止）
- Stripe 側がリトライしてくれる（最大数日間、指数バックオフ）
- `express.raw()` で生のリクエストボディを受け取る必要がある（署名検証のため）

---

## 共通する「イベント駆動」の設計原則

3つのパターンは表面的に異なるが、すべて同じ原則に従っている:

### 1. Producer と Consumer の分離（疎結合）

| パターン         | Producer      | Consumer           | 分離の仕組み                       |
| ---------------- | ------------- | ------------------ | ---------------------------------- |
| ドメインイベント | AggregateRoot | Subscriber         | DomainEventBus（メモリ内ルーター） |
| Outbox           | Subscriber    | IntegrationHandler | Outbox テーブル + routingKey       |
| Webhook          | Stripe        | WebhookController  | HTTP + エンドポイントURL           |

Producer は「イベントを発行する」だけ。誰が受け取るか、何をするかは知らない。

### 2. イベントは「事実の記録」

```
// ドメインイベント: 「ログインが成功した」という事実
new PasswordUserLoggedInEvent(user)

// Outbox: 「認証成功イベントが発生した」という事実
{ routingKey: "audit.log", eventType: "auth.login.success" }

// Webhook: 「決済が成功した」という事実
{ type: "payment_intent.succeeded", data: { id: "pi_xxx" } }
```

すべて「〜が起きた」という過去形。命令（〜してくれ）ではない。

### 3. 信頼性の担保方法

| パターン         | 「届かなかったら？」の対策                                          |
| ---------------- | ------------------------------------------------------------------- |
| ドメインイベント | 同期実行なので失敗 = UseCase 全体が失敗（トランザクション巻き戻し） |
| Outbox           | DB永続化 + Worker リトライ（指数バックオフ）+ DLQ                   |
| Webhook          | Stripe 側リトライ + 冪等性キー（同じイベントが2回来ても安全）       |

### 4. 「なぜ直接呼ばないのか」

```
// ❌ 直接呼び出し（密結合）
class LoginUseCase {
    async execute() {
        await this.authService.login(user)
        await this.auditService.log(user)      // Auth が Audit を知っている
        await this.notificationService.send()   // Auth が Notification を知っている
    }
}

// ✅ イベント駆動（疎結合）
class LoginUseCase {
    async execute() {
        await this.authService.login(user)
        await this.eventPublisher.publishAll(user.pullDomainEvents())
        // Auth は「ログインした」と言うだけ。誰が何をするかは知らない
    }
}
```

受信側を追加・削除しても、UseCase を変更する必要がない。

---

## Webhook を「外部版 Outbox」として理解する

| 観点               | Outbox（自分 → 自分）     | Webhook（外部 → 自分）  |
| ------------------ | ------------------------- | ----------------------- |
| 永続化             | Outbox テーブルに保存     | Stripe 側が保持         |
| ポーリング/配信    | OutboxWorker が実行       | Stripe が HTTP POST     |
| リトライ           | 自前（指数バックオフ）    | Stripe 側（最大72時間） |
| 冪等性             | idempotencyKey で重複排除 | event.id で重複排除     |
| 配信先ルーティング | routingKey → Handler      | event.type → UseCase    |
| 信頼性検証         | DB トランザクション       | 署名検証 (HMAC)         |

**Outbox**: 自分が Producer、自分が Consumer。DB を介して非同期通知。  
**Webhook**: 外部が Producer、自分が Consumer。HTTP を介して非同期通知。

やっていることの本質（**非同期イベント通知 + 信頼性担保**）は同じ。

---

## 本プロジェクトでの具体的なイベントフロー例

### 例: アクティビティ参加費の決済

```
[ユーザー]
    │
    │ 「参加する」ボタン押下
    ▼
[フロントエンド]
    │
    │ POST /v1/activities/:id/participate
    ▼
[バックエンド API]
    │
    │ CreateParticipationUseCase.execute()
    │   → stripe.paymentIntents.create()      ← API呼び出し（内部→外部）
    │   → DB に参加レコード保存 (status=PENDING)
    ▼
[Stripe]
    │
    │ カード会社と通信... 3Dセキュア認証...（非同期）
    │
    │ 決済成功！
    │ HTTP POST /v1/webhooks/stripe           ← Webhook（外部→内部）
    ▼
[Webhook Controller]
    │
    │ 署名検証 → event.type = "payment_intent.succeeded"
    │ → HandleStripePaymentSucceededUseCase.execute()
    │   → 参加レコードを CONFIRMED に更新
    │   → addDomainEvent(ParticipationConfirmedEvent)  ← ドメインイベント
    │   → publishAll()
    ▼
[DomainEventBus]
    │
    ├→ Subscriber → Outbox 保存                ← 統合イベント（Outbox）
    │                  ↓
    │            OutboxWorker
    │                  ↓
    │            Push通知「参加が確定しました」
    │
    └→ Subscriber → ドメイン内処理（参加者数カウント更新など）
```

**1つの操作の中で、3つのパターンすべてが連鎖している。**

---

## 関連ドキュメント

- [eventdriven_README.md](/backend/eventdriven_README.md) — ドメインイベントの詳細フロー
- [outbox-design.md](/projects/01_arc_docs/backend/outbox/outbox-design.md) — Outbox パターンの設計判断
- [cloudservice-setting.md](/projects/01_arc_docs/cloudservice-setting.md) — Stripe Webhook の設定手順
