import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { AuthMethod } from '@/application/auth/model/AuthMethod.js'
import { EmailAlreadyInUseError } from '@/application/user/error/EmailAlreadyInUseError.js'
import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { User } from '@/domains/user/domain/model/entity/User.js'
import { DisplayName } from '@/domains/user/domain/model/valueObject/DisplayName.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'

export type RegisterUserTxRepositories = {
    user: IUserRepository
    outbox: IOutboxRepository
}

export class RegisterUserService {
    constructor(
        private readonly integrationEventFactory: IntegrationEventFactory,
        private readonly outboxEventFactory: OutboxEventFactory
    ) { }

    async register<TRepos extends RegisterUserTxRepositories>(
        params: {
            userId: UserId
            email?: EmailAddress | null
            displayName?: DisplayName | null
            authMethod: AuthMethod
            onEmailAlreadyInUse?: () => Error
        },
        repos: TRepos,
        afterUserSaved?: (repos: TRepos, user: User) => Promise<void>
    ): Promise<{ user: User; domainEvents: BaseDomainEvent[] }> {
        if (params.email) {
            const exists = await repos.user.findByEmail(params.email.getValue())
            if (exists) {
                throw params.onEmailAlreadyInUse
                    ? params.onEmailAlreadyInUse()
                    : new EmailAlreadyInUseError()
            }
        }

        const user = User.register({
            userId: params.userId,
            email: params.email ?? null,
            displayName: params.displayName ?? null,
            authMethod: params.authMethod,
        })

        await repos.user.save(user)

        if (afterUserSaved) {
            await afterUserSaved(repos, user)
        }

        const domainEvents = user.pullDomainEvents()

        const integrationEvents = domainEvents.flatMap((e) =>
            this.integrationEventFactory.createManyFrom(e)
        )

        const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
        await repos.outbox.saveMany(outboxEvents)

        return { user, domainEvents }
    }

    static toEmailAddressNullable(value: string | null | undefined): EmailAddress | null {
        if (value == null || value === '') {
            return null
        }
        return EmailAddress.create(value)
    }
}
