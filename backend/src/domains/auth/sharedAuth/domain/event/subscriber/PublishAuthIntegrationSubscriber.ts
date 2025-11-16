// src/domains/auth/sharedAuth/domain/event/subscriber/PublishAuthIntegrationSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { AuthDomainEvent } from '../AuthDomainEvent.js'
import { UserLoggedInIntegrationEvent } from '../UserLoggedInIntegrationEvent.js'
import { UserLoginFailedIntegrationEvent } from '../UserLoginFailedIntegrationEvent.js'

/**
 * Authドメイン共通のIntegration Subscriber。
 * outcome（SUCCESS/FAILURE）に応じてIntegrationEventを生成し、Outboxに保存する。
 * 
 * - AuthDomainEventは成功／失敗の両方を抽象的に扱う。
 * - OutboxRepositoryへの依存は抽象（IOutboxRepository）経由で注入。
 */
export class PublishAuthIntegrationSubscriber
    implements DomainEventSubscriber<AuthDomainEvent> {
    constructor(private readonly outboxRepository: IOutboxRepository) { }

    /** 購読対象の識別名。Auth系イベント全般を対象とするため固定名でよい。 */
    eventName(): string {
        return 'AuthIntegrationPublisher'
    }

    /** ドメインイベント受信時の処理 */
    async handle(event: AuthDomainEvent): Promise<void> {
        const occurredAt = new Date()

        if (event.outcome === 'FAILURE') {
            const integrationEvent = new UserLoginFailedIntegrationEvent({
                userId: (event as any).userId,
                email: (event as any).email,
                authMethod: (event as any).authMethod,
                reason: (event as any).reason ?? 'UNKNOWN',
                ipAddress: (event as any).ipAddress,
                occurredAt,
            })
            await this.outboxRepository.save(integrationEvent)
        } else {
            const integrationEvent = new UserLoggedInIntegrationEvent({
                userId: (event as any).userId,
                email: (event as any).email,
                authMethod: (event as any).authMethod,
                ipAddress: (event as any).ipAddress,
                occurredAt,
            })
            await this.outboxRepository.save(integrationEvent)
        }
    }
}
