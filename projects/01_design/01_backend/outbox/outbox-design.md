# Outbox パターン設計 — 経緯・判断・現在の構成

> 作成日: 2026-03-11
> 対象: `backend/src/integration/`, `backend/src/job/outbox/`

---

## 1. Outbox パターンとは

トランザクション内で「本体の DB 書き込み」と「外部連携用のイベント（OutboxEvent）書き込み」を
**同一トランザクションで原子的に実行** し、別プロセスの OutboxWorker がポーリングして
外部システムへ配送するパターン。

```
┌──── TX ─────────────────────────┐
│  ① ビジネスデータ INSERT/UPDATE  │
│  ② OutboxEvent INSERT           │
└─────────────────────────────────┘
        ↓ (commit)
  OutboxWorker (polling)
        ↓ routingKey で dispatch
  IntegrationHandler → 外部システム (FCM / LINE / etc.)
```

### メリット

- ビジネス TX と配送保証が原子的（メッセージロストなし）
- リトライ + DLQ（DeadLetterQueue）で配送保証
- ハンドラー単位の障害分離（FCM 障害が LINE に影響しない）

### 向いているケース / 向かないケース

| 向いている                              | 向かない                           |
| --------------------------------------- | ---------------------------------- |
| 外部 HTTP 呼び出し（FCM, LINE, Stripe） | 同一 DB への INSERT（AuditLog 等） |
| 失敗時にリトライが必要                  | TX の一貫性だけで十分              |
| 配送先が一時的に不達になりうる          | 書き込み先がメイン DB と同一       |

---

## 2. 現在の routingKey 一覧

| routingKey          | Handler                              | 配送先                     | 投入元                                                       |
| ------------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------ |
| `notification.push` | `PushNotificationIntegrationHandler` | Firebase FCM（外部）       | `NotificationService.prepareNotification()` / ReminderWorker |
| `webhook.line`      | `LineWebhookIntegrationHandler`      | LINE Messaging API（外部） | `CreateAnnouncementUseCase` / `CreatePollUseCase`            |

**登録箇所**: `integrationDispatcherRegistrar.ts`

---

## 3. 2 種類の OutboxEvent 投入フロー

現在、OutboxEvent を投入するフローは **2 系統** ある。

### フロー A: IntegrationEventFactory 経由（DomainEvent → 変換）

```
AggregateRoot.addDomainEvent()
  → DomainEventFlusher.flushEvents()
    → IntegrationEventFactory.createManyFrom(source)
      → OutboxEventFactory.createManyFrom(integrationEvents)
        → repos.outbox.saveMany(outboxEvents)
```

**設計意図**: DDD の DomainEvent を外部契約（IntegrationEvent）に変換するレイヤ。
Fan-out（1 DomainEvent → 複数 routingKey）やペイロード変換を Factory が担当。

**現状**: 旧 AuditLog/UserLifecycle を廃止した結果、`IntegrationEventFactory.createManyFrom()` の
switch-case は **すべて空（default → `[]`）** になっている。
将来 DomainEvent ベースの外部連携が増えた場合はここに追加する。

### フロー B: UseCase / Service が直接 OutboxEvent を生成

```
UseCase / NotificationService
  → new OutboxEvent({ routingKey: 'notification.push', ... })
  → repos.outbox.save(outboxEvent)
```

**設計意図**: 通知のように「TX 内で通知レコード + OutboxEvent を同時に作りたい」ケースでは、
DomainEvent を経由するより UseCase 内で直接 OutboxEvent を作る方がシンプル。

**現在の利用箇所**:

| 投入元                                      | routingKey          | 備考                 |
| ------------------------------------------- | ------------------- | -------------------- |
| `NotificationService.prepareNotification()` | `notification.push` | 全通知の共通パス     |
| `startPaymentReminderWorker.ts`             | `notification.push` | Job から直接投入     |
| `startScheduleReminderWorker.ts`            | `notification.push` | Job から直接投入     |
| `CreateAnnouncementUseCase`                 | `webhook.line`      | お知らせ → LINE 通知 |
| `CreatePollUseCase`                         | `webhook.line`      | 投票 → LINE 通知     |

### なぜ 2 系統が共存しているか

| フロー            | 抽象度                         | 向いている場面                                               |
| ----------------- | ------------------------------ | ------------------------------------------------------------ |
| A（Factory 経由） | 高い。DomainEvent から自動変換 | DomainEvent の fan-out が必要な場合                          |
| B（直接生成）     | 低い。UseCase が直接構築       | 通知のように「本体レコード + OutboxEvent」をセットで作る場合 |

**統一すべきか？**: 現時点では不要。フロー A は将来の拡張ポイントとして残し、
実用的な通知系はフロー B で直接的に書く方が可読性が高い。

---

## 4. AuditLog を Outbox から分離した経緯

### Before（〜2026-03-10）

```
Login TX:
  ① User 認証
  ② OutboxEvent INSERT (routingKey: 'audit.log')
     ↓ (commit)
  OutboxWorker
     ↓ dispatch
  AuditLogIntegrationHandler (HTTP self-call)
     ↓ POST /integration/audit/log
  AuditLogIntegrationController
     ↓
  RecordAuditLogUseCase
     ↓
  AuditLogRepository.save() → DB INSERT
```

**routingKey 4 種**:
- `audit.log` — 認証イベント（login success/failed）
- `user.lifecycle.audit` — ユーザー登録イベント
- `notification.push` — FCM プッシュ通知
- `webhook.line` — LINE Webhook

### 問題点

| #   | 問題                      | 詳細                                                                                                                                             |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **過剰な複雑性**          | 同一 DB への INSERT に 7 ファイル経由（DomainEvent → Factory → Outbox → Worker → Dispatcher → HTTP Handler → Controller → UseCase → Repository） |
| 2   | **不要な HTTP self-call** | localhost の自分自身に HTTP POST して DB INSERT するだけ。ネットワークエラーの余地を無駄に作っている                                             |
| 3   | **結果整合性が不要**      | AuditLog は同一 DB。TX の強一貫性で十分なのに、Outbox の結果整合性（ラグ・Worker障害リスク）を受け入れていた                                     |
| 4   | **リトライの無意味さ**    | 同一 DB への INSERT が失敗する = DB 自体が壊れている。リトライしても回復しない                                                                   |
| 5   | **障害分離が機能しない**  | AuditLog テーブルだけが壊れてメイン処理は正常、というシナリオは同一 DB では実質ありえない                                                        |

### After（2026-03-11〜）

```
Login TX:
  ① User 認証
  ② AuthAuditLog INSERT ← 同一 TX 内で直接 INSERT
     ↓ (commit)
  完了（Worker 不要）
```

**routingKey 2 種のみ**:
- `notification.push` — FCM プッシュ通知（外部）
- `webhook.line` — LINE Webhook（外部）

### 比較表

| 観点               | Before（Outbox 経由）            | After（TX 内 INSERT）                |
| ------------------ | -------------------------------- | ------------------------------------ |
| **一貫性**         | 結果整合性（ラグあり）           | ✅ 強一貫性（同一 TX）                |
| **失敗時**         | AuditLog 欠損可能（Worker 障害） | ✅ TX rollback で全体失敗（欠損なし） |
| **パフォーマンス** | HTTP 往復 + DB write ×2          | ✅ DB write ×1 追加のみ               |
| **コード量**       | 7 ファイル経由                   | ✅ UseCase 内 1 行                    |
| **外部依存**       | なし（同一 DB）                  | なし（同上）                         |

### 設計原則

> **Outbox パターンは外部システム連携専用。同一 DB 内のデータ書き込みには TX 内 INSERT を使う。**

---

## 5. AuditLog テーブルの現在の設計

旧 `AuditLog`（単一テーブル）を廃止し、ドメインごとに `{Domain}AuditLog` テーブルを分離。

| テーブル                | 用途                                                       | 書き込み方式 |
| ----------------------- | ---------------------------------------------------------- | ------------ |
| `AuthAuditLog`          | 認証イベント（login success/failed, user registered）      | TX 内 INSERT |
| `CommunityAuditLog`     | コミュニティ変更履歴（名前変更, ロール変更, メンバー除名） | TX 内 INSERT |
| `ParticipationAuditLog` | 参加履歴（JOINED/CANCELLED/REMOVED_BY_ADMIN）              | TX 内 INSERT |
| `WaitlistAuditLog`      | キャンセル待ち履歴（JOINED/CANCELLED/PROMOTED）            | TX 内 INSERT |

### 命名パターン

```
{Domain}AuditLog
  ├── id           (PK, UUID)
  ├── {domainKey}  (e.g. scheduleId, communityId, userId)
  ├── action       (e.g. 'JOINED', 'CANCELLED', 'LOGIN_SUCCESS')
  ├── ...domain固有フィールド (cancelledAt, paymentMethod, etc.)
  └── createdAt    (INSERT 日時)
```

### なぜドメイン別に分離したか

| 観点         | 単一テーブル                                   | ドメイン別テーブル（現設計）           |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| スキーマ     | カラムが各ドメインの UNION。NULL だらけ        | ✅ ドメインごとに最適なカラム定義       |
| クエリ       | `WHERE domain = 'auth' AND ...` フィルタが必要 | ✅ テーブル指定で十分                   |
| インデックス | 巨大テーブルにインデックス。効率悪化           | ✅ 小テーブルごとに最適インデックス     |
| 独立進化     | カラム追加が全ドメインに影響                   | ✅ ドメインごとに独立してカラム追加可能 |
| 移行リスク   | 全ドメインが同時に壊れる                       | ✅ 障害がドメイン単位で分離             |

---

## 6. OutboxWorker の動作フロー

```
OutboxWorker.start(interval)
  └── loop:
        ├── repo.findPending(limit=20)     … PENDING の OutboxEvent を取得
        ├── for each event:
        │     ├── retryPolicyRepo.findByRoutingKey(event.routingKey)
        │     ├── dispatcher.dispatch(routingKey, event)
        │     │     └── handler.handle(event)        … FCM送信 / LINE POST
        │     ├── 成功 → repo.markAsPublished()
        │     └── 失敗 →
        │           ├── retryable && retryCount < maxRetries
        │           │     → repo.incrementRetry() + delay(equalJitter)
        │           └── !retryable || retryCount >= maxRetries
        │                 → dlqRepo.save() + repo.markAsFailed()
        └── sleep(interval)
```

### RetryPolicy（DB seed）

```sql
-- outbox-retry-policy.sql
INSERT INTO "OutboxRetryPolicy" ("routingKey", "baseInterval", "maxInterval", "maxRetries")
VALUES
  ('notification.push', 5000, 60000, 5),
  ('webhook.line',      5000, 60000, 5)
ON CONFLICT ("routingKey") DO UPDATE SET ...
```

### DLQ（DeadLetterQueue）

配送失敗が maxRetries に達したイベントは `OutboxDeadLetter` テーブルに記録される。
手動での再処理や障害分析に使用。

---

## 7. ファイル構成

```
backend/src/
├── integration/
│   ├── IntegrationEventFactory.ts        ← フロー A: DomainEvent → IntegrationEvent 変換
│   ├── IntegrationEvent.ts               ← IntegrationEvent 型定義
│   ├── IntegrationSource.ts              ← 変換元の型定義
│   ├── dispatcher/
│   │   ├── IntegrationDispatcher.ts      ← routingKey → Handler のマッピング
│   │   └── handler/
│   │       ├── IntegrationHandler.ts             ← 抽象ハンドラ
│   │       ├── PushNotificationIntegrationHandler.ts  ← FCM 送信
│   │       └── LineWebhookIntegrationHandler.ts       ← LINE Messaging API
│   ├── outbox/
│   │   ├── model/entity/OutboxEvent.ts   ← OutboxEvent エンティティ
│   │   └── repository/
│   │       ├── IOutboxRepository.ts
│   │       ├── OutboxRepository.ts
│   │       ├── IOutboxDeadLetterRepository.ts
│   │       ├── OutboxDeadLetterRepository.ts
│   │       ├── IOutboxRetryPolicyRepository.ts
│   │       └── OutboxRetryPolicyRepository.ts
│   └── error/
│       └── IntegrationError.ts           ← エラー型（retryable 判定含む）
├── job/
│   └── outbox/
│       └── outboxWorker.ts               ← ポーリングワーカー
└── _bootstrap/
    └── integrationDispatcherRegistrar.ts ← Handler 登録
```

---

## 8. 設計判断ログ

| #    | 日付       | 判断                                              | 理由                                                                                     |
| ---- | ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| D-22 | 2026-03-11 | AuditLog を Outbox から TX 内 INSERT に移行       | 同一 DB への INSERT に Outbox は過剰。強一貫性・シンプル・高速                           |
| D-23 | 2026-03-11 | Outbox スコープを外部システム連携のみに縮小       | `audit.log`, `user.lifecycle.audit` を廃止。`notification.push`, `webhook.line` のみ残存 |
| D-21 | 2026-03-11 | AuditLog をドメイン別テーブルに分離               | `{Domain}AuditLog` パターン。スキーマ独立進化・クエリ効率・障害分離                      |
| —    | 初期設計   | Outbox パターン採用                               | FCM / LINE 等の外部 HTTP 呼び出しに配送保証が必要                                        |
| —    | 初期設計   | IntegrationEventFactory + 直接生成の 2 フロー共存 | DomainEvent 変換と通知直接生成は設計意図が異なる。無理に統一しない                       |
