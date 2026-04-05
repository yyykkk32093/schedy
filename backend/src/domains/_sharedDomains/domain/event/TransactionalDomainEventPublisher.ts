// src/domains/_sharedDomains/domain/event/TransactionalDomainEventPublisher.ts

import { BaseDomainEvent } from './BaseDomainEvent.js'

/**
 * TX 内ドメインイベント発行インターフェース。
 *
 * UseCase は UoW.run() のコールバック第2引数としてこの Publisher を受け取り、
 * 集約から pull したイベントを publish する。
 *
 * Publisher 内部で TX-scope リポジトリを捕捉しており、
 * Subscriber の handle() に repos を透過的に渡す。
 * UseCase 側は repos の受け渡しを意識する必要がない。
 *
 * ```typescript
 * await this.unitOfWork.run(async (repos, txEventPublisher) => {
 *     membership.leave()
 *     await repos.membership.save(membership)
 *     await txEventPublisher?.publishAll(membership.pullDomainEvents())
 * })
 * ```
 */
export interface TransactionalDomainEventPublisher {
    publish(event: BaseDomainEvent): Promise<void>
    publishAll(events: BaseDomainEvent[]): Promise<void>
}
