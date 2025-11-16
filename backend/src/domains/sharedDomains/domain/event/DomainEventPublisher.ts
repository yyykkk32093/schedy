import { BaseDomainEvent } from './BaseDomainEvent.js'

/**
 * ドメインイベントを publish するインターフェース。
 * 実装は同期／非同期いずれでも可。
 */
export interface DomainEventPublisher {
    publish(event: BaseDomainEvent): Promise<void>
    publishAll(events: BaseDomainEvent[]): Promise<void>
}
