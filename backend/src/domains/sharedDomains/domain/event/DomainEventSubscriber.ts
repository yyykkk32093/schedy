// src/sharedDomains/domain/event/DomainEventSubscriber.ts
import { BaseDomainEvent } from './BaseDomainEvent.js'

/**
 * DomainEventを購読するSubscriberの共通インターフェース。
 * 各イベントごとに対応するSubscriberを実装する。
 */
export interface DomainEventSubscriber<T extends BaseDomainEvent> {
    /** 購読対象のイベント名 */
    eventName(): string

    /** イベント受信時のハンドリング処理 */
    handle(event: T): Promise<void> | void
}
