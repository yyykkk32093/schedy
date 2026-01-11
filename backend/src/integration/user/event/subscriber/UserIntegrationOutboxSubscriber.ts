// src/integration/user/subscriber/UserIntegrationOutboxSubscriber.ts

import { logger } from '@/_sharedTech/logger/logger.js'
import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { IntegrationSubscriber } from '@/integration/IntegrationSubscriber.js'
import { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'

import { UserApplicationEventIntegrationMapper } from '../../mapper/UserApplicationEventIntegrationMapper.js'
import { UserDomainEventIntegrationMapper } from '../../mapper/UserDomainEventIntegrationMapper.js'

export class UserIntegrationOutboxSubscriber
    implements IntegrationSubscriber {

    private readonly appEventMapper =
        new UserApplicationEventIntegrationMapper()

    private readonly domainEventMapper =
        new UserDomainEventIntegrationMapper()

    constructor(
        private readonly outboxRepository: IOutboxRepository
    ) { }

    subscribedTo(): string[] {
        return [
            // ApplicationEvent（将来追加可）
            // 'UserSomethingHappenedEvent',

            // DomainEvent
            'UserRegisteredEvent',
        ]
    }

    async handle(event: IntegrationSource): Promise<void> {
        logger.info(
            { eventName: event.eventName },
            '[UserIntegrationOutboxSubscriber] IntegrationSource → Outbox'
        )

        const outboxEvent =
            this.appEventMapper.tryMap(event)
            ?? this.domainEventMapper.tryMap(event)

        if (!outboxEvent) return

        await this.outboxRepository.save(outboxEvent)
    }
}
