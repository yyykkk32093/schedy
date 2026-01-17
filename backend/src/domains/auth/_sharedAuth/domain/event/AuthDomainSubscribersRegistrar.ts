import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'

import { PasswordSignInFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordSignInFailedSubscriber.js'
import { PasswordSignInSucceededSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordSignInSucceededSubscriber.js'

/**
 * AuthDomainSubscribersRegistrar
 *
 * - DomainEventBus（shared）へ subscribe する
 * - Outbox永続化は行わない（Outboxはtx内で確定させるのが正）
 */
export function registerAuthDomainSubscribers(bus: DomainEventBus): void {
    bus.subscribe(new PasswordSignInSucceededSubscriber())
    bus.subscribe(new PasswordSignInFailedSubscriber())
}
