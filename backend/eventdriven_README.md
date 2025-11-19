🍱 ① AggregateRoot（イベントの蓄積）
protected addDomainEvent(event: BaseDomainEvent): void {
    this.domainEvents.push(event)
}


➡ ここで PasswordUserLoggedInEvent などが“蓄積”される。

public pullDomainEvents(): BaseDomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents.length = 0
    return events
}


➡ UseCase が「全部取り出して → flush」する場所。

🍣 ② UseCase（publishAll の起点）
await this.eventPublisher.publishAll(user.pullDomainEvents())


➡ これが“すべての後続処理の起点”
➡ ここで DomainEventBus.publish(event) が走る。

🍺 ③ DomainEventBus（実際の “イベント配信”）
const eventName = event.eventName


例： "PasswordUserLoggedInEvent"

const hits = this.subscribers.filter(
    (s) => s.eventName() === eventName
)


➡ AuthEventRegistry で登録された Subscriber だけがここでヒットする。

最後に：

await s.handle(event)


➡ 各 Subscriber に event が渡る。

🧩 これを線で繋ぐとこうなる
① addDomainEvent(event)
        │
        ▼
② UseCase.execute() の最後:
   eventPublisher.publishAll(events)
        │
        ▼
③ DomainEventBus.publish(event)
        │
        ▼
④ subscribers.filter(...) で該当リスナーに通知
        │
        ├── PasswordUserLoggedInSubscriber.handle(event)
        │
        └── PublishAuthIntegrationSubscriber.handle(event)

🔥 ここからは「各 Subscriber が何してるか」
🍩 PasswordUserLoggedInSubscriber.handle(event)

→ Auth ドメイン内部の“その場の副作用”を担当する人

役割：

ログイン成功時のドメインローカルな処理
（ログ回収・ポイント付与・認証履歴更新など）

あなたの構成ならここはまだ薄いが、将来増える。

🍰 PublishAuthIntegrationSubscriber.handle(event)

→ “Auth ドメインを出て外へ繋ぐ” ための橋渡し担当

役割：

AuthDomainEvent → IntegrationEvent 変換

OutboxEvent として保存

Transaction（Auth DB）と同期して確実性担保

これが「外部境界を越えるイベント」。

🍵 重要：2つの Subscriber が「同じイベントを受信」できる理由

DomainEventBus の subscribers 配列に両方登録されてるから。

AuthEventRegistry で：

authDomainEventBus.subscribe(new PasswordUserLoggedInSubscriber())
authDomainEventBus.subscribe(new PublishAuthIntegrationSubscriber(outboxRepo))


👉 これだけで "複数購読" が成立する。

🧠 あなたの理解ポイントが正しかったか？

PasswordUserLoggedInSubscriber と PublishAuthIntegrationSubscriber
どうやって繋がる？

👉 繋がる部分は DomainEventBus.publish() 内の subscribers[] だけ。

どこで登録してる？

👉 AuthEventRegistry。

どこが起点？

👉 UseCase の publishAll()。

Outbox の橋渡しは？

👉 PublishAuthIntegrationSubscriber.handle(event)。

全部あなたの理解は方向性バッチリ。

🍙 前提コードのままで説明は変わる？

➡ 変わらない。
むしろあなたのコードは超王道設計。
そのまま説明にぴったり合致してる。

🎁 最後に “あなた用まとめ” （30秒で全体像思い出せる版）
AggregateRoot.addDomainEvent()
        ↓
UseCase.publishAll()
        ↓
DomainEventBus.publish()
        ↓
subscriber[eventName === x].handle(event)
        ├ PasswordUserLoggedInSubscriber  → ドメイン内処理
        └ PublishAuthIntegrationSubscriber → Outbox に流す



#️⃣ ドメインイベント & Outbox 連携の流れ（Markdown整理版）
## 1️⃣ AggregateRoot：イベントを“蓄積”する役割
protected addDomainEvent(event: BaseDomainEvent): void {
    this.domainEvents.push(event)
}


エンティティ（PasswordUser など）が
「イベント起きた！」 と合図する場所

まだ発火しない（バスには渡されない）

取得とクリア：

public pullDomainEvents(): BaseDomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents.length = 0
    return events
}


UseCase が全部回収してバスへ流す

## 2️⃣ UseCase：publishAll() の起点
await this.eventPublisher.publishAll(user.pullDomainEvents())


UseCase が “イベントの発射ボタン” を押す部分

ここが すべての後続処理のスタート地点

## 3️⃣ DomainEventBus：イベントの“配信センター”
async publish(event: TEvent) {
    const hits = this.subscribers.filter(
        (s) => s.eventName() === event.eventName
    )
    for (const s of hits) await s.handle(event)
}


Subscriber 達が並んでいて

eventName() が一致する全員に通知される

publishAll() は順次送るだけ：

async publishAll(events: TEvent[]) {
    for (const e of events) await this.publish(e)
}

## 4️⃣ AuthEventRegistry：購読者（Subscriber）の登録場所

AuthEventRegistry.ts：

authDomainEventBus.subscribe(new PasswordUserLoggedInSubscriber())
authDomainEventBus.subscribe(new PasswordUserLoginFailedSubscriber())
authDomainEventBus.subscribe(new PublishAuthIntegrationSubscriber(outboxRepo))


ここで DomainEventBus は内部的に以下を保持する：

subscribers = [
  PasswordUserLoggedInSubscriber,
  PasswordUserLoginFailedSubscriber,
  PublishAuthIntegrationSubscriber
]


📌 これで“複数の Subscriber が同じイベントを受信できる”。

## 5️⃣ Subscriber たちが実際に何をしているか
### 🟦 A. PasswordUserLoggedInSubscriber（ドメイン内部の副作用担当）

ログイン成功時のドメイン内部処理専門

例：監査用ドメインモデル更新、失敗回数リセットなど

この Subscriber は Auth ドメイン内の処理だけを担当。

### 🟩 B. PublishAuthIntegrationSubscriber（Outbox 連携担当）

AuthDomainEvent → IntegrationEvent を生成

OutboxEvent としてデータベースへ保存

await this.outboxRepository.save(integrationEvent)


📌 これが「Auth → Audit」などの“ドメイン外連携”の橋渡し。

## 6️⃣ 全体のデータフロー（図で理解）
① AggregateRoot.addDomainEvent()
        ↓
② UseCase.publishAll()
        ↓
③ DomainEventBus.publish(event)
        ↓
④ subscribers から eventName でフィルタリング
        ↓
⑤ 以下の両者がイベントを受信：

   ┌────────────────────────────┐
   │ PasswordUserLoggedInSubscriber.handle() │
   │  → Authドメイン内の副作用                │
   └────────────────────────────┘

   ┌─────────────────────────────────────────┐
   │ PublishAuthIntegrationSubscriber.handle() │
   │  → IntegrationEventを生成                │
   │  → OutboxRepository.save()               │
   └─────────────────────────────────────────┘

## 7️⃣ 全体まとめ（30秒で思い出せる版）

イベントは AggregateRoot に蓄積

UseCase が publishAll() で発火

DomainEventBus が購読者へ配信

購読者は AuthEventRegistry で登録

イベントを複数 Subscriber が同時に受信する

PasswordUserLoggedInSubscriber → Auth 内部の処理

PublishAuthIntegrationSubscriber → Outbox に保存（外部連携）


🟥 OutboxPublisher.ts は Express 上では動かさない。
🟩 Node.js の “素のプロセス” として動かす。
❓ なぜ Express の中で動かさへんの？

Express は HTTP サーバであって、
OutboxPublisher は **HTTP サーバじゃない（永続ループを回すワーカー）**から。

✔ OutboxPublisher の本質

HTTP リクエストに応答しない

setInterval や cron 的に永続ループで動く

DB から未送信イベントを拾って

Audit API に POST し続ける

API サーバ来ようが関係なく動く

つまり “普通の Node.js スクリプト” として動かすべきやねん。

🟦 イメージ：あなたのプロジェクトは 3 プロセス動く
① Front API server
   → Express

② System (Audit) API server
   → Express

③ OutboxPublisher worker
   → Node.js（Expressなし）


全部別プロセスや。

✔ outboxPublisher.ts の構成イメージ
// src/workers/outboxPublisher.ts
import { outboxRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js'
import axios from 'axios'

async function publishLoop() {
  const pending = await outboxRepository.findPending(50)

  for (const ev of pending) {
    try {
      await axios.post(
        'http://localhost:3001/system/audit/log',
        ev.payload,
      )
      await outboxRepository.markAsPublished(ev.id)
    } catch (err) {
      await outboxRepository.markAsFailed(ev.id)
    }
  }
}

setInterval(publishLoop, 3000)

console.log('📦 OutboxPublisher started. Polling every 3 sec...')

✔ Express は使ってない
✔ app.listen() もない
✔ HTTP 受け付けもしない
✔ ただの常駐ワーカー
✔ どう起動するの？
node dist/workers/outboxPublisher.js


package.json で script にしてもよし

{
  "scripts": {
    "worker:outbox": "node dist/workers/outboxPublisher.js"
  }
}

🟣 じゃあこれをどうやって PM2/本番系で動かす？

本番ではこう：

pm2 start dist/api/server.js       # フロントAPI
pm2 start dist/api/system/server.js # Audit API
pm2 start dist/workers/outboxPublisher.js # Outboxワーカー


全部別サービスとして扱う。

🟡 補足：Express と分ける理由（超重要）

API サーバに OutboxPublisher をねじ込むと、

永続ループがスレッド占有

API が遅くなる

スケールアウト時に多重実行 → イベント多重送信

責務が崩壊

なので絶対 NG。

🎉 最終結論

OutboxPublisher は Node.js 単体プロセス。
Express の外側で動かすのが正しい。


🔥 「subscribe() は誰が呼ぶ？何をしてる？」

を ゼロから“図”で整理 する。

あなたの違和感は 超正しい。
理由は “subscribe = 購読する” っぽく見えるのに
実際は “購読者（Subscriber）を登録する” だから。

DDD のイベントバスは日本語にするとこう：

publish = イベントを投げる

subscribe =（Busに）購読者を登録する

なので、
「あれ…どこで呼んでたっけ？」
ってなるのは普通。

👇 完全に理解できる図を出す。

🧩 全体構造（超シンプル）
UseCase --- publish ---> EventBus --- dispatch ---> Subscriber

✔ まず「Subscriber（ハンドラ）」を書く
class PasswordUserLoggedInSubscriber {
    subscribedTo() { return "PasswordUserLoggedInEvent" }
    async handle(event) {
        console.log("ログイン成功したよ")
    }
}

✔ それを Bus に登録 するのが subscribe()

（この時点ではイベントはまだ飛ばない）

const bus = new DomainEventBus()
bus.subscribe(new PasswordUserLoggedInSubscriber())

これが「購読者を登録している」瞬間。
🧠 どこで subscribe() が呼ばれてるか？

あなたの現在の構成では ここ：

registerAuthDomainSubscribers()


内部にこういうコードがある：

authDomainEventBus.subscribe(new PasswordUserLoggedInSubscriber())
authDomainEventBus.subscribe(new PasswordUserLoginFailedSubscriber())
authDomainEventBus.subscribe(new PublishAuthIntegrationSubscriber())


つまり：

🎯 UseCase の実行時には subscribe() は一切呼ばれない

UseCase の実行フローはこう：

UseCase
  └─ entity.addDomainEvent()
  └─ eventPublisher.publishAll(events)
      └─ eventBus.publish(event)
          └─ 「登録済み subscriber を検索して dispatch」


※ subscribe() は 起動時に一度呼んで登録しているだけ。

🔍 用語の整理（めっちゃ大事）
名前	意味	誰が呼ぶ？
subscribe	サブスクライバーを EventBus に「登録する」	起動時（registerProducer みたいな場所）
publish	イベントを Bus に「投げる」	UseCase
handle	イベントを受け取って処理する	Subscriber
subscribedTo	「私はこのイベントを購読します」と宣言	Subscriber 内部
🧩 混乱ポイントの本質はこれ

あなたが今思っている疑問：

「subscribeって“購読する”であって、“購読者を登録する”操作ではないのでは？」

これは 英語の曖昧性 が原因。

実際には：

subscribe（動詞）＝登録する（to subscribe to a topic）

subscriber（名詞）＝購読者（サブスクライバー）

subscription（名詞）＝購読情報

もう最初から英語がややこしい。

✔ サクッと覚える「3行まとめ」

subscribe() は Bus が保持するリストにハンドラを登録すること

subscribe() は起動時や registerArtifacts() で呼ぶ

UseCase 実行中に subscribe() は絶対呼ばれない