import { logger } from '@/_sharedTech/logger/logger.js'
import { DomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/DomainEventSubscriber.js'

import { UserRegisteredEvent } from '../UserRegisteredEvent.js'

export class UserRegisteredSubscriber
    implements DomainEventSubscriber<UserRegisteredEvent> {
    subscribedTo(): string {
        return 'UserRegisteredEvent'
    }

    handle(event: UserRegisteredEvent): void {
        logger.info(
            {
                userId: event.userId.getValue(),
                email: event.email.getValue(),
            },
            '[UserRegisteredSubscriber] ユーザ登録'
        )
    }
}
