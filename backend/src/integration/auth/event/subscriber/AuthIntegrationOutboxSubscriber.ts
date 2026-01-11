// src/application/auth/subscriber/PublishAuthIntegrationSubscriber.ts

import { logger } from '@/_sharedTech/logger/logger.js'
import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { IntegrationSubscriber } from '@/integration/IntegrationSubscriber.js'
import { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'

import { AuthApplicationEventIntegrationMapper } from '@/integration/auth/mapper/AuthApplicationEventIntegrationMapper.js'
import { AuthDomainEventIntegrationMapper } from '@/integration/auth/mapper/AuthDomainEventIntegrationMapper.js'

export class AuthIntegrationOutboxSubscriber
    implements IntegrationSubscriber {

    private readonly appEventMapper = new AuthApplicationEventIntegrationMapper()
    private readonly domainEventMapper = new AuthDomainEventIntegrationMapper()

    constructor(
        private readonly outboxRepository: IOutboxRepository
    ) { }

    subscribedTo(): string[] {
        return [
            // ApplicationEvent
            'UserLoginSucceededEvent',
            'UserLoginFailedEvent',

            // DomainEvent
        ]
    }

    async handle(event: IntegrationSource): Promise<void> {
        logger.info(
            { eventName: event.eventName },
            '[AuthIntegrationOutboxSubscriber] IntegrationSource → Outbox'
        )

        const outboxEvent =
            this.appEventMapper.tryMap(event)
            ?? this.domainEventMapper.tryMap(event)

        if (!outboxEvent) return

        await this.outboxRepository.save(outboxEvent)
    }
}
