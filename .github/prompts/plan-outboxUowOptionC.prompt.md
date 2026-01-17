## Plan: Tx内Outbox原子化ルール定着

Option C（tx-scope Repository）を正として、Outboxを「事実確定の一部」として同一トランザクション内で `saveMany` まで確定させます。commit後は `publish(events)` のみ（in-process副作用限定）に統一し、Outbox永続化・外部連携は絶対に行いません。契約文字列（`eventType/routingKey/payload`）は共通OutboxEventFactoryへ集約し、`audit.log` と `user.lifecycle.*` は無期限併存（重複送信は期待動作・異常扱いしない）としてドキュメントに固定します。

### Steps
1. 設計正本を更新する（重複送信/併存/非異常扱いを明文化）: [backend/src/integration/outbox/outbox.md](backend/src/integration/outbox/outbox.md)
2. 運用正本を更新する（RetryPolicyはseed/migration担保、fail-fastしない）: [backend/prisma/prisma.md](backend/prisma/prisma.md) と [backend/infra/database/ddl/master/outbox-retry-policy.sql](backend/infra/database/ddl/master/outbox-retry-policy.sql)
3. ルートREADMEは導線のみ追加する（詳細は書かない）: [README.md](README.md) から上記2ドキュメントへリンク
4. UoWをOption C APIに寄せる（tx-scope Repo群を生成してUseCaseへ渡す）: [backend/src/application/_sharedApplication/uow/IUnitOfWork.ts](backend/src/application/_sharedApplication/uow/IUnitOfWork.ts) と [backend/src/application/_sharedApplication/uow/PrismaUnitOfWork.ts](backend/src/application/_sharedApplication/uow/PrismaUnitOfWork.ts)
5. Flusherをpublish専用に分離し、UseCase側で `pull→tx内Outbox化→commit後publish` を徹底する: [backend/src/application/_sharedApplication/event/DomainEventFlusher.ts](backend/src/application/_sharedApplication/event/DomainEventFlusher.ts) と呼び出し元（例: [backend/src/application/user/usecase/SignUpUserUseCase.ts](backend/src/application/user/usecase/SignUpUserUseCase.ts)）
6. 共通OutboxEventFactoryを新設し、段階導入をUser SignUp（UserRegistered）に限定して適用する: 追加先候補は [backend/src/application/_sharedApplication](backend/src/application/_sharedApplication) 配下（新規 `outbox/` ディレクトリ）

### Further Considerations
1. 互換縮退の範囲: IntegrationOutboxSubscriber（例: [backend/src/integration/user/event/subscriber/UserIntegrationOutboxSubscriber.ts](backend/src/integration/user/event/subscriber/UserIntegrationOutboxSubscriber.ts)）は当面残しつつ、Outbox永続化責務は撤退で合意済み
2. routingKey併存の扱い: `audit.log` と `user.lifecycle.audit` を同時生成し、重複送信はDLQ/監視上も異常扱いしない旨を明記（idempotencyKey前提）
3. ApplicationEventのOutbox化は今回スコープ外: IntegrationSource実装時のみ対象の方針は維持し、まずはUser SignUpに限定して段階導入
