// domains/auth/sharedAuth/domain/event/AuthEventRegistry.ts
import { PasswordUserLoggedInSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.js'
import { PasswordUserLoginFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.js'
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { authDomainEventBus } from './AuthDomainEventBus.js'
import { PublishAuthIntegrationSubscriber } from './integration/PublishAuthIntegrationSubscriber.js'

export function registerAuthDomainSubscribers(
    outboxRepository: IOutboxRepository
) {

    authDomainEventBus.subscribe(new PasswordUserLoggedInSubscriber())
    authDomainEventBus.subscribe(new PasswordUserLoginFailedSubscriber())

    // Outbox連携（DIでoutboxRepositoryを注入）

    authDomainEventBus.subscribe(
        new PublishAuthIntegrationSubscriber(outboxRepository)
    )
}
