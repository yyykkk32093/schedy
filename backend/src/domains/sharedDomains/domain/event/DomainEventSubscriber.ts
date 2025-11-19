// src/domains/sharedDomains/domain/event/DomainEventSubscriber.ts
import { BaseDomainEvent } from './BaseDomainEvent.js'

/**
 * ドメインイベントのSubscriber共通インターフェース。
 * - 1つのイベントだけ購読する場合は string
 * - 複数のイベントを購読したい場合は string[]
 */
export interface DomainEventSubscriber<T extends BaseDomainEvent> {
    subscribedTo(): string | string[]
    handle(event: T): Promise<void> | void
}
