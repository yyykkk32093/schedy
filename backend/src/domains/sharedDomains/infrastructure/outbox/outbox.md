## 境界づけられたコンテキスト（BC）単位のトランザクション分離方針

### 1. 基本方針
- 原則として、**BC（Bounded Context）単位で独立したトランザクション境界を設ける**。
- 目的は以下の通り：
  - 各BCの**独立性**を確保し、変更影響を限定する。
  - **疎結合化**による保守性・再利用性の向上。
  - 将来的な**マイクロサービス化**や独立デプロイへの布石。

---

### 2. トランザクション分離の判断基準
| 観点 | トランザクションを分けるべき | 同一にまとめてもよい |
|:--|:--|:--|
| 各BCが独立してリリース可能か | Yes | No |
| 外部システムとの連携を持つか | Yes | No |
| トランザクション整合性が不要／最終的整合性で良い | Yes | No |
| DBスキーマが独立しているか | Yes | No |
| 担当チーム・ドメイン知識が異なる | Yes | No |

> ✅ 上記の観点でYesが多い場合、BC単位でトランザクションを分離し、非同期イベント連携（Outboxパターン）を採用する。

---

### 3. トランザクション分離時の実装パターン
| 連携種別 | 対象 | 推奨手法 |
|:--|:--|:--|
| 同一ドメイン内 | 集約間連携 | In-memory EventBus（同期処理） |
| 同一アプリ内・異BC間 | 疎結合連携 | **Transactional Outbox + Event Dispatcher**（非同期処理） |
| 異アプリ間 | システム間連携 | Outbox + メッセージブローカ（Kafka/SQSなど） |

---

### 4. Outboxパターンを用いる理由
- **永続化とイベント発行のアトミック性**を保証できる。
- **トランザクション分離**による一貫性低下を「最終的整合性」で補完する。
- イベント配信の**再送制御・リトライ**を容易に実現。
- モノリシックでも将来的な**BC分離・マイクロサービス化**を見据えた設計が可能。

---

### 5. Outboxを導入すべき典型例
| 例 | 理由 |
|:--|:--|
| Auth → Audit | 認証結果を監査ログに出力。監査失敗しても認証結果は保持すべき。 |
| Order → Payment | 受注と決済の整合性は非同期で許容される。リトライ可。 |
| User → Notification | 通知送信は業務ロジックに必須でない。非同期適性が高い。 |

---

### 6. Outboxを使わないケース
- 同一トランザクションで整合性が絶対に必要な業務。
  - 例：「在庫引当」と「出荷登録」が一体化しており、整合性が欠けると不具合になる場合。
- 実質的に1つのユビキタス言語・モデルで成り立っており、BCを分ける意味が薄い場合。

---

### 7. 方針まとめ
> - 原則：BC単位で独立したトランザクション境界を設ける。
> - 目的：疎結合・独立デプロイ・責務分離。
> - 手段：Outboxパターンによる非同期イベント連携。
> - 例外：業務上どうしても同期整合性が必要な場合のみ同一TX内で完結させる。

---

### 8. 今後の設計ドキュメント反映方針
- 各BC設計書に「トランザクション境界」「イベント連携種別」「整合性保証方式」を明記する。
- Outbox実装部分は共通コンポーネント化（OutboxRepository, EventDispatcherなど）。
- 内部ドメインイベント（集約間連携）はメモリ内EventBusを共通利用する。


② 役割まとめ（あなたの構造に完全対応した整理）

あなたが今作ってる非同期アーキテクチャには、
5つの役割が登場していて、これが理解できればもう迷わない。

🌟 1. Subscriber（サブスクライバー）
✔ ドメインイベントを拾う担当

Auth のドメインイベントが発行されたとき（ログイン成功 / 失敗など）
それを受け取り、IntegrationEvent に変換して Outbox に保存する。

例：
PublishAuthIntegrationSubscriber

async handle(event: AuthDomainEvent) {
    const integrationEvent = mapper.map(event)
    await outboxRepository.save(integrationEvent)
}


📌 Subscriber は “Outbox に置く” だけ。送信はしない。

🌟 2. Publisher（パブリッシャー）
✔ Outbox に溜まった「送るべきイベント」を取り出し、Dispatcher に渡す

Publisher はポーリングで動くワーカー（Express と別プロセス）で、

findPending → dispatcher.dispatch()


を繰り返す。

例：
OutboxPublisher

Publisher は 送信方法（URLなど）を知らない
→ だから疎結合でスケールしやすい。

🌟 3. Dispatcher（ディスパッチャー）
✔ routingKey → handler をルーティングするだけの本当に細い役割
dispatcher.dispatch('audit.record-auth-log', payload)


dispatcher は“配送先担当者を見つけるだけ”。

例：
IntegrationDispatcher

📌 Publisher は Dispatcher に渡すだけ。Dispatcher は Handler を呼ぶだけ。

🌟 4. Handler（ハンドラー）
✔ 実際に「どこに送るか」を知っている層

（HTTP / Kafka / SQS / Webhook など）

今回の例では HTTP 送信。

例：
AuditLogIntegrationHandler

await axios.post('http://localhost:3000/system/audit/log', payload)


📌 Handler が唯一 “送信方法” を知っている場所。

🌟 5. Registry（レジスター）
✔ Dispatcher に「どの routingKey にどの Handler を割り当てるか」を登録する

例：

dispatcher.register('audit.record-auth-log', new AuditLogIntegrationHandler())


これは DI コンテナと同じ役割。

📌 レジスターだけ変更すれば、新しい連携先を追加できる。
Publisher、Subscriber、ドメイン側には何も影響しない。
→ 完全に OCP（開放閉鎖原則）。

🔥 全体まとめ（図で理解）
[Auth Domain Event]
      │
      ▼
[PublishAuthIntegrationSubscriber]
      │
      ▼
[OutboxRepository.save()]  ← DB に PENDING イベントを積む
      │
      ▼ (別プロセス)
[OutboxPublisher (polling)]
      │
      ▼
[IntegrationDispatcher]  ← routingKey を見て振り分け
      │
      ▼
[IntegrationHandler]      ← HTTP / Kafka / SQS など実送信
      │
      ▼
[Audit API]


この分割により：

✔ Subscriber と Handler が“お互いに存在を知らなくても動く”
✔ Publisher は“配送方法を知らずにイベントを投げる”
✔ Dispatcher は“routingKey だけで handler をルーティング”
✔ Registry だけいじれば新連携先が増やせる（Handlerは実装必要）

🟩 routingKey / eventType の最終ルール（完全版）
■ 1. routingKey：内部ルーティングのためのキー
※ “Node.js backend 内で handler を選ぶためだけに存在する”
🔥 使用者

IntegrationDispatcher（あなたの Worker）

IntegrationHandler（内部ロジック）

🔥 用途

Worker 内でどの Handler に渡すかを決める

🔥 粒度の決め方

内部の事情に合わせて自由

eventType と同じでもいい

eventType より細かくてもいい

eventType より粗くてもいい

🔥 値の例（内部都合）
auth.login.success.password
auth.login.success.oauth
auth.login.success.biometric
payment.charge.completed
payment.refund.failed

🔥 ポイント

外部 API（Audit）は routingKey を理解する必要は一切ない

あくまで “あなたの backend 内のルーティングキー”

■ 2. eventType：外部 API のためのイベント名
🔥 使用者

Audit API（あなたの Integration API）

他ドメイン（User, Billing など将来拡張）

将来的に別サービスに独立してもそのまま利用可能

🔥 用途

外部 API が理解する “契約上の名前”

イベントの意味を外部へ伝える

🔥 粒度の決め方

外部 API が理解できる単位

外部の都合で粒度が変わり得る

routingKey と必ずしも一致しなくてよい

🔥 値の例（外部 API 都合）
auth.login.success
auth.login.failed
user.created
user.password.reset
profile.updated
payment.completed

🧠 routingKey / eventType の関係性
情報粒度	routingKey	eventType
内部の方が細かいケース	◎ よくある	○ 外部用に単純化
外部の方が細かいケース	○ 必要なら合わせる	◎ 外部 API の要求
同じ粒度	◎ 合意すればそれもOK	◎ 問題なし
🎯 最重要ポイント（設計原則）
✔ routingKey と eventType を “役割で分離” しておくことで
→ 外部 API の仕様変更が内部構造に侵食しない
→ 内部の handler 構造を自由に再構築できる