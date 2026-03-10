import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { CommunityCreatedSubscriber } from './subscriber/CommunityCreatedSubscriber.js'

export function registerCommunityDomainSubscribers(bus: DomainEventBus): void {
    bus.subscribe(new CommunityCreatedSubscriber())
}
