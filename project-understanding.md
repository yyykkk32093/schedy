# プロジェクト理解ドキュメント（初版）

> 目的：この文書は、今後の設計相談・改修・拡張・レビューにおいて、私（AI）とあなた（作者）の間で「長期的にズレない共通認識」を維持するための前提資料です。
>
> 推論ラベルの使い分け：
> - 【事実】コード／設定／ドキュメントから直接読めること
> - 【解釈】構造・命名・依存関係から自然に導ける理解
> - 【一般論】一般的なアーキテクチャ観点（このプロジェクトの文脈に接続して書く）
> - 【仮説】作者の意図として考えられるが未確認な点

## 1. 概要

- 【事実】リポジトリは `frontend/`（React + Vite + TS）と `backend/`（Express + TS + Prisma）に分かれ、フロントはHTTPでバックエンドAPIを呼び出す構成。
- 【事実】バックエンドはDDD/レイヤ分割（`api/` → `application/` → `domains/`）を前提としており、API層が「ブラウザ実行制約（Node依存・セキュリティ等）」を受けて導入された旨が [backend_README.md](backend_README.md) に明記されている。
- 【解釈】ドメインは少なくとも `auth/`, `user/`, `schedule/`, `audit/` を想定しており、現時点で動線が太いのは `auth` と `audit`（ログイン→監査ログ記録）。
- 【仮説】プロジェクト名 `schedy` と `Activity` テーブル（Prisma）から、スケジュール/予定管理を核にしつつ、認証・ユーザー管理・監査ログ・将来の外部連携（Outbox）を同居させて育てる設計意図がある。

## 2. 全体構造

### ディレクトリ構成（要点）

- 【事実】`frontend/`: React 19 + Vite。UIとAPI通信。
- 【事実】`backend/src/api/`: Express API（ルーティング/コントローラ）。
- 【事実】`backend/src/application/`: UseCase とアプリケーションイベント（ApplicationEvent）など。
- 【事実】`backend/src/domains/`: エンティティ/ValueObject/ドメインサービス/Repository interface + 実装（infrastructure）。
- 【事実】`backend/src/integration/`: IntegrationEvent 生成・Outbox・Dispatcher・Handler（外部連携の配送/受信）。
- 【事実】`backend/src/job/`: バックグラウンドワーカー（OutboxWorker）。
- 【事実】`backend/src/_bootstrap/`: イベントバス初期化や登録（Bootstrap/Registrar）。
- 【事実】`backend/src/_sharedTech/`: DB/HTTP/logger/security/util など技術基盤。

### レイヤ／モジュールごとの責務（このリポジトリ流）

- 【事実】API層（`backend/src/api`）
  - ルート定義（`*Routes.ts`）を自動ロードして `express.Router()` を `app.use('/')` で登録。
  - controller で request → UseCase 呼び出し → response を生成。
  - 現状、例外処理/バリデーションは各コントローラ内の try/catch や手書きチェックが中心。

- 【事実】Application層（`backend/src/application`）
  - UseCase がユースケースの手続き（例：ログイン）を実行。
  - UseCaseは `ApplicationEventPublisher` を通じて ApplicationEvent を発行し、副作用（ログ、Outbox保存など）は Subscriber に委譲。

- 【事実】Domain層（`backend/src/domains`）
  - ValueObject（例：EmailAddress, UserId, PlainPassword）を使い、型/不変条件を寄せる。
  - Repositoryは interface と implementation が分かれている。

- 【事実】Integration層（`backend/src/integration`）
  - ApplicationEvent/DomainEvent を「外部向けの意味（eventType）」と「内部配送キー（routingKey）」に分離して OutboxEvent に変換（Mapper）。
  - OutboxEvent をDBに積み、別プロセスのワーカーが配送（Outboxパターン）。
  - 受信側も `api/integration/...` として「他BC/他サービスからのイベント受取API」を用意。

- 【解釈】この構成は「単一サービス内に複数BCを同居させつつ、将来の分離（別サービス化）を視野に入れた境界線」を先に引いている。

## 3. 実行フロー

### 3.1 エントリーポイント

- 【事実】Backend API サーバ起動： [backend/src/api/server.ts](backend/src/api/server.ts)
  - `dotenv-flow` で `backend/env` から環境変数読み込み。
  - `tsconfig-paths` を登録し、パスエイリアス（`@/` など）を runtime 解決。
  - `src/api` 配下を再帰探索し、`*Routes.ts`/`*Routes.js` を動的 import して自動登録。
  - `ApplicationEventBootstrap.bootstrap()` で ApplicationEventBus と購読者登録を初期化。

- 【事実】Outbox Worker 起動： [backend/src/job/outbox/startOutboxWorker.ts](backend/src/job/outbox/startOutboxWorker.ts)
  - `OutboxWorkerRegistrar.createWorker()` で依存（OutboxRepository/RetryPolicyRepo/Dispatcher/DLQ）を組み立て。
  - `worker.startLoop(3000)` でポーリング開始。

- 【事実】Frontend 起動：`frontend/package.json` の `vite`（ただしルートREADMEはViteテンプレ文が中心で、プロダクト仕様は未記載）。

### 3.2 主要な処理の流れ（ログイン成功→監査ログ記録）

1) 【事実】HTTP: `POST /v1/auth/password`
- ルート: [backend/src/api/front/auth/password/routes/passwordAuthRoutes.ts](backend/src/api/front/auth/password/routes/passwordAuthRoutes.ts)
- コントローラ: [backend/src/api/front/auth/password/controllers/passwordAuthController.ts](backend/src/api/front/auth/password/controllers/passwordAuthController.ts)

2) 【事実】Controller → UseCase
- controller は `usecaseFactory.createSignInPasswordUserUseCase()` を呼び、UseCaseを生成して `execute()`
- factory: [backend/src/api/_usecaseFactory.ts](backend/src/api/_usecaseFactory.ts)

3) 【事実】UseCase 内の主要手順（パスワードログイン）
- [backend/src/application/auth/password/usecase/SignInPasswordUserUseCase.ts](backend/src/application/auth/password/usecase/SignInPasswordUserUseCase.ts)
  - User取得 → Credential取得 → verify → JWT発行
  - 成功/失敗いずれも `eventPublisher.publish(new UserLogin...Event)` を実行

4) 【事実】ApplicationEventBus が Subscriber に配信
- `ApplicationEventBus.publish()` は購読者の `subscribedTo()` と `event.eventName` を照合して `handle()` を順番に await
  - bus: [backend/src/application/_sharedApplication/event/ApplicationEventBus.ts](backend/src/application/_sharedApplication/event/ApplicationEventBus.ts)

5) 【事実】Auth の購読者登録
- 起動時に `registerAuthApplicationSubscribers()` が呼ばれ、ログ用Subscriber + Outbox用Subscriber が登録される
  - registry: [backend/src/application/auth/event/AuthApplicationEventRegistry.ts](backend/src/application/auth/event/AuthApplicationEventRegistry.ts)
  - bootstrap: [backend/src/_bootstrap/ApplicationEventBootstrap.ts](backend/src/_bootstrap/ApplicationEventBootstrap.ts)

6) 【事実】Outboxへの保存（Integration化）
- `AuthIntegrationOutboxSubscriber` が ApplicationEvent を受け取り、Mapperで `OutboxEvent` に変換して `OutboxRepository.save()`
  - subscriber: [backend/src/integration/auth/event/subscriber/AuthIntegrationOutboxSubscriber.ts](backend/src/integration/auth/event/subscriber/AuthIntegrationOutboxSubscriber.ts)
  - mapper: [backend/src/integration/auth/mapper/AuthApplicationEventIntegrationMapper.ts](backend/src/integration/auth/mapper/AuthApplicationEventIntegrationMapper.ts)
  - outbox entity: [backend/src/integration/outbox/model/entity/OutboxEvent.ts](backend/src/integration/outbox/model/entity/OutboxEvent.ts)
  - repo: [backend/src/integration/outbox/repository/OutboxRepository.ts](backend/src/integration/outbox/repository/OutboxRepository.ts)

7) 【事実】別プロセス（OutboxWorker）が配送
- `repo.findPending()`（status=PENDING & nextRetryAt<=now）を取得し、`dispatcher.dispatch(routingKey, event)`
- retry policy がDB必須で、無い場合は FAILED 扱い
  - worker: [backend/src/job/outbox/outboxWorker.ts](backend/src/job/outbox/outboxWorker.ts)
  - retry repo: [backend/src/integration/outbox/repository/OutboxRetryPolicyRepository.ts](backend/src/integration/outbox/repository/OutboxRetryPolicyRepository.ts)

8) 【事実】IntegrationDispatcher が routingKey で Handler を選択
- registrar が `audit.log` に `AuditLogIntegrationHandler` を登録
  - registrar: [backend/src/_bootstrap/integrationDispatcherRegistrar.ts](backend/src/_bootstrap/integrationDispatcherRegistrar.ts)
  - dispatcher: [backend/src/integration/dispatcher/IntegrationDispatcher.ts](backend/src/integration/dispatcher/IntegrationDispatcher.ts)

9) 【事実】AuditLogIntegrationHandler が外部（または別BC）へHTTP POST
- 送信先は `${AUDIT_API_BASE_URL}/integration/v1/audit/logs`
- idempotencyKey とヘッダ `Idempotency-Key` を付与
  - handler: [backend/src/integration/dispatcher/handler/AuditLogIntegrationHandler.ts](backend/src/integration/dispatcher/handler/AuditLogIntegrationHandler.ts)

10) 【事実】受信側 Integration API が監査ログをDB保存
- 受信API: `POST /integration/v1/audit/logs`
  - route: [backend/src/api/integration/audit/log/routes/auditLogIntegrationRoutes.ts](backend/src/api/integration/audit/log/routes/auditLogIntegrationRoutes.ts)
  - controller: [backend/src/api/integration/audit/log/controllers/auditLogIntegrationController.ts](backend/src/api/integration/audit/log/controllers/auditLogIntegrationController.ts)
- `RecordAuditLogUseCase` が `eventType` で handler を切替し、`AuditLogRepositoryImpl` で保存
  - usecase: [backend/src/application/audit/log/usecase/RecordAuditLogUseCase.ts](backend/src/application/audit/log/usecase/RecordAuditLogUseCase.ts)

### 3.3 ドメインイベント（DomainEvent）について

- 【事実】`DomainEventBootstrap` は現状コメントアウトされている： [backend/src/_bootstrap/DomainEventBootstrap.ts](backend/src/_bootstrap/DomainEventBootstrap.ts)
- 【解釈】現フェーズは「UseCase結果（ApplicationEvent）中心」で、DomainEventは今後の拡張余地として温存している。

## 4. 設計の特徴

### 4.1 採用していそうな設計パターン

- 【事実】DDDレイヤ構造（API/Application/Domain） + 共有モジュール（`_shared*`）
- 【事実】Outboxパターン + ポーリングワーカー + DLQ（`OutboxDeadLetter`）
- 【事実】イベント駆動（ApplicationEventBus + Subscriber）
- 【事実】Mapper（IntegrationSource → OutboxEvent）
- 【解釈】軽量DI（`usecaseFactory` / Registrar / Bootstrapで手組み）

### 4.2 一般的な選択肢との比較（このプロジェクトではどうか）

- 【一般論】
  - 典型的なWeb APIは「Controller → Service → Repository」になりがちで、イベントを導入しない場合は副作用がUseCase/Serviceに寄りやすい。
  - Outboxを採用すると「DB書き込みと外部送信の分離」「リトライ/冪等性」「障害時の追跡性」が上がる一方、運用対象（Worker/ポリシー/監視）が増える。

- 【解釈】このプロジェクトでは、
  - UseCaseは “結果” をイベント化し、ログ/外部連携（Audit）は Subscriber/Outbox に逃がすことで、UseCaseの凝集度を保とうとしている。
  - `routingKey` と `eventType` を役割で分離する方針が明文化されており（[backend/src/integration/outbox/outbox.md](backend/src/integration/outbox/outbox.md)）、将来の外部仕様変更に耐える意図が強い。

### 4.3 この構成のメリット・デメリット

- 【解釈】メリット
  - UseCaseの責務が「同期処理の完了」と「イベント発行」に寄り、副作用の増殖を抑えやすい。
  - Outboxにより外部連携の信頼性が上がり、失敗時の再送/隔離（DLQ）も設計に組み込まれている。
  - `Routes` 自動ロードにより、API追加が「ファイル追加＝登録」になり、構造の一貫性を保ちやすい。

- 【解釈】デメリット/クセ
  - ApplicationEventBus は in-process で逐次 `await` 実行のため、Subscriberが増えるとAPI応答時間に影響し得る（特にOutbox保存が同期である点）。
  - トランザクション境界がコードからは見えにくい（例：ログイン処理とOutbox書き込みが同一トランザクションである保証は現状読み取りにくい）。
  - API層の例外処理/バリデーションが「コントローラごと」に散りやすい（現状は共通ミドルウェアの集中管理が薄い）。
  - `AUDIT_API_BASE_URL` の指す先によっては「同一サーバへのHTTP自己呼び出し」になり得て、無駄/循環のリスクがある（※ただし将来別サービス化なら自然）。

## 5. 用語・共通概念整理

- 【事実】ApplicationEvent
  - UseCaseの“結果”を表す（[backend/src/application/_sharedApplication/event/ApplicationEvent.ts](backend/src/application/_sharedApplication/event/ApplicationEvent.ts)）
  - `eventName` で購読対象を決める

- 【事実】ApplicationEventBus / Subscriber
  - `publish(event)` が購読者へ配信、`subscribedTo()` の一致でルーティング

- 【事実】IntegrationSource
  - ApplicationEvent/DomainEvent のうち、Outbox化できる「連携元イベント」を表すインターフェース（イベントが implements している）

- 【事実】OutboxEvent
  - 配送用レコード（DB永続化）
  - `eventName`（元イベント名）, `eventType`（外部契約上の意味）, `routingKey`（内部ルーティング）

- 【事実】routingKey vs eventType
  - routingKey：内部のHandler選択のキー
  - eventType：外部（受信側）に渡す契約上のイベント名
  - ルールは [backend/src/integration/outbox/outbox.md](backend/src/integration/outbox/outbox.md) に明文化

- 【事実】OutboxWorker
  - PENDINGイベントをポーリングし、RetryPolicyに従って再送/失敗/DLQ保存

- 【事実】DLQ（OutboxDeadLetter）
  - max retry超過で隔離する永続先

- 【解釈】Registrar / Bootstrap
  - 「どこで何を登録するか」を起動時の集中点に寄せ、追加作業の導線を作るための仕組み

## 6. 仮説と未確定事項

- 【仮説】Auditは「将来別サービス/別BC化」する前提で、現状は同一backend内に受信APIと保存UseCaseを同居させている（`AUDIT_API_BASE_URL` の運用で形が変わる）。
- 【仮説】ApplicationEventBusでOutbox保存を同期にしているのは、「まず確実に積む」ことを優先し、外部送信はWorkerに任せる設計意図。
- 【未確定】UseCaseのDB更新（ユーザー最終ログイン時刻等）とOutbox保存を同一トランザクションにしたい要件があるか？（現状コードからは判断不能）
- 【未確定】`OutboxRetryPolicy` の初期データ投入手段（migration/seed/運用）がどこまで整備されているか。
- 【未確定】API層で「認証/認可」「入力DTOバリデーション」「例外→HTTP変換」を共通化する方針があるか。
- 【未確定】DomainEvent と ApplicationEvent の棲み分け基準（どの粒度からDomainEventに寄せるか）。

## 7. 今後の対話における前提ルール案

- 【提案】会話では常に【事実/解釈/一般論/仮説】を区別し、設計判断が必要な箇所は「どのラベルに基づく判断か」を明示する。
- 【提案】改修/拡張の基本導線（共通言語）を固定する：
  - API追加：`api/**/routes/*Routes.ts` + controller + usecaseFactory（必要なら）
  - ユースケース追加：`application/**/usecase` に実装し、必要なイベント/DTOを `application/**` に置く
  - ドメイン変更：`domains/**` のVO/Entity/Repository interface を先に整える
  - 外部連携追加：IntegrationEvent（eventType/routingKey）→ Mapper → Outbox → Dispatcher登録 → Handler実装
- 【提案】この文書は「初版」なので、重要な前提が変わったら追記する（例：DomainEvent導入、認可の方式変更、Integrationが別サービス化など）。
- 【提案】更新ルール：更新時は「変更理由・影響範囲・破壊的変更の有無」を 3点セットで追記し、次回以降の会話で参照できるようにする。


ーーーこのMDを作成した際のAIに対するINPUTーーーモデル：GPT-５.2 ,モード：agent

あなたはこのリポジトリを理解・整理する
「共同設計者（co-author）」として振る舞ってください。
私はオリジナル作者です。

目的：
このプロジェクトについて、
私とあなたの間で「長期的にズレない共通認識」を作り、
今後の設計相談・改修・拡張・レビューを
高精度で行える状態にすることです。

今回はその第一段階として、
あなたの理解結果を Markdown（.md）形式の
ドキュメントとしてまとめてください。
このドキュメントは、今後の会話の前提資料になります。

探索方針：

agent としてリポジトリを自律的に探索してよい
ただし「全ファイルを網羅的に読む」ことは避け、
構造理解に必要な最小限のファイルに留めること
どの観点でファイルを選んだかを暗黙的に反映させること
重視する観点（優先順）：

実行エントリーポイントと処理フロー
ディレクトリ／レイヤ構造と責務分割
設計上の特徴・クセ・トレードオフ
一般的な設計パターンとの比較
（一般論としてどうか／このプロジェクトではどうか）
今後の対話で共通言語として使えそうな用語・概念
推論ルール：

【事実】コードから直接読み取れる内容
【解釈】構造や命名から自然に導ける理解
【一般論】一般的な設計・アーキテクチャ観点
【仮説】作者の意図として考えられるが未確認な点
これらを必ず区別して記述してください。
出力形式（Markdown）：

プロジェクト理解ドキュメント（初版）
1. 概要
このプロジェクトは何を目的としているか（事実＋解釈）
2. 全体構造
ディレクトリ構成
レイヤ／モジュールごとの責務
3. 実行フロー
エントリーポイント
主要な処理の流れ
4. 設計の特徴
採用していそうな設計パターン
一般的な選択肢との比較
この構成のメリット・デメリット
5. 用語・共通概念整理
このプロジェクト特有の言葉
一般用語だが意味が限定されているもの
6. 仮説と未確定事項
作者に確認すべき点
今後の会話で前提にしない方がよい点
7. 今後の対話における前提ルール案
この理解をどう扱うか
更新が必要になった場合の扱い
注意：

一般論だけで終わらせないこと
このプロジェクト固有の文脈を最優先すること
あなたは将来、私の設計レビュー役になる前提で書いてください