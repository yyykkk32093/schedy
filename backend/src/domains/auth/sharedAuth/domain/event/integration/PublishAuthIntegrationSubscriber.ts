// src/domains/auth/sharedAuth/domain/event/subscriber/PublishAuthIntegrationSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { logger } from '@/sharedTech/logger/logger.js'
import { AuthDomainEvent } from '../AuthDomainEvent.js'
import { AuthIntegrationEventMapper } from '../mapper/AuthIntegrationEventMapper.js'


export class PublishAuthIntegrationSubscriber
    implements DomainEventSubscriber<AuthDomainEvent> {
    constructor(private readonly outboxRepository: IOutboxRepository) { }

    /** Authのイベント全般を購読する（複数） */
    subscribedTo(): string[] {
        return [
            'PasswordUserLoggedInEvent',
            'PasswordUserLoginFailedEvent',
        ]
    }


    async handle(event: AuthDomainEvent): Promise<void> {

        logger.info({ aggregateId: event.aggregateId }, "[PublishAuthIntegrationSubscriber] 認証ドメインイベントをOutboxに保存します")

        const mapper = new AuthIntegrationEventMapper()
        const integrationEvent = mapper.map(event)
        await this.outboxRepository.save(integrationEvent)
    }
}



