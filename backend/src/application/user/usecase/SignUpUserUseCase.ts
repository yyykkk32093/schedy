import { IPasswordHasher } from '@/domains/auth/_sharedAuth/service/security/IPasswordHasher.js'
import { IPasswordCredentialRepository } from '@/domains/auth/password/domain/repository/IPasswordCredentialRepository.js'
import { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

import { PasswordCredential } from '@/domains/auth/password/domain/model/entity/PasswordCredential.js'

import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { DisplayName } from '@/domains/user/domain/model/valueObject/DisplayName.js'

import { ApplicationEventPublisher } from '@/application/_sharedApplication/event/ApplicationEventPublisher.js'
import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { RegisterUserService } from '@/application/user/service/RegisterUserService.js'
import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { PlainPassword } from '@/domains/auth/_sharedAuth/model/valueObject/PlainPassword.js'

export type SignUpUserTxRepositories = {
    user: IUserRepository
    credential: IPasswordCredentialRepository
    outbox: import('@/integration/outbox/repository/IOutboxRepository.js').IOutboxRepository
}

export class SignUpUserUseCase {

    constructor(
        private readonly passwordHasher: IPasswordHasher,
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<SignUpUserTxRepositories>,
        private readonly registerUserService: RegisterUserService,
        private readonly domainEventFlusher: DomainEventFlusher,
        private readonly applicationEventPublisher: ApplicationEventPublisher,
    ) { }

    async execute(input: {
        email: string
        password: string
        displayName?: string | null
    }): Promise<{ userId: string }> {

        // ================================
        // 1️⃣ 入力を ValueObject に変換
        // ================================
        const email = EmailAddress.create(input.email)
        const displayName = DisplayName.createNullable(input.displayName)

        // ================================
        // 3️⃣ UserId 発番
        // ================================
        const userId = UserId.create(this.idGenerator.generate())

        // ================================
        // 4️⃣ Aggregate 生成
        // ================================
        const hashedPassword = await this.passwordHasher.hash(
            PlainPassword.create(input.password)
        )

        const credential = PasswordCredential.create({
            userId: userId.getValue(),
            hashedPassword,
        })

        let eventsToPublish: BaseDomainEvent[] = []

        // ================================
        // 5️⃣ 永続化 + Outbox確定（同一トランザクション）
        // ================================
        await this.unitOfWork.run(async (repos) => {
            const { domainEvents } = await this.registerUserService.register(
                {
                    userId,
                    email,
                    displayName,
                    authMethod: 'password',
                },
                repos,
                async () => {
                    await repos.credential.save(credential)
                }
            )

            eventsToPublish = domainEvents
        })

        // ================================
        // 6️⃣ commit後: publish-only（in-process副作用のみ）
        // ================================
        await this.domainEventFlusher.publish(eventsToPublish)

        // ================================
        return {
            userId: userId.getValue(),
        }
    }
}
