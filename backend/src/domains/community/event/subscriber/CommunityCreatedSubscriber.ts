import { logger } from '@/_sharedTech/logger/logger.js'
import { DomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/DomainEventSubscriber.js'
import { CommunityCreatedEvent } from '../CommunityCreatedEvent.js'

export class CommunityCreatedSubscriber
    implements DomainEventSubscriber<CommunityCreatedEvent> {

    subscribedTo(): string {
        return 'CommunityCreatedEvent'
    }

    handle(event: CommunityCreatedEvent): void {
        logger.info(
            {
                communityId: event.communityId.getValue(),
                name: event.name.getValue(),
                createdBy: event.createdBy.getValue(),
            },
            '[CommunityCreatedSubscriber] コミュニティ作成'
        )
    }
}
