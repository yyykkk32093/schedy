import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { UserRegisteredSubscriber } from './subscriber/UserRegisteredSubscriber.js'

/**
 * UserDomainSubscribersRegistrar
 *
 * - DomainEventBus（shared）へ subscribe する
 * - Outbox永続化は行わない（Outboxはtx内で確定させるのが正）
 *
 * 現時点では User ドメインの DomainEvent subscriber は未導入。
 * 必要になったらここで一括登録する。
 */
export function registerUserDomainSubscribers(_bus: DomainEventBus): void {
    _bus.subscribe(new UserRegisteredSubscriber())
}
