// src/application/auth/password/usecase/SignInPasswordUserUseCase.ts

import { logger } from '@/_sharedTech/logger/logger.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { ApplicationEventPublisher } from '@/application/_sharedApplication/event/ApplicationEventPublisher.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import {
    AuthFailureReason,
    AuthenticationFailedError,
} from '@/application/auth/error/AuthenticationFailedError.js'
import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { PlainPassword } from '@/domains/auth/_sharedAuth/model/valueObject/PlainPassword.js'
import { IPasswordHasher } from '@/domains/auth/_sharedAuth/service/security/IPasswordHasher.js'
import { IPasswordCredentialRepository } from '@/domains/auth/password/domain/repository/IPasswordCredentialRepository.js'
import { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { AuthMethod } from '../../model/AuthMethod.js'
import {
    SignInPasswordUserInput,
    SignInPasswordUserOutput,
} from '../dto/SignInPasswordUserDTO.js'

export type SignInPasswordUserTxRepositories = {
    user: IUserRepository
    credential: IPasswordCredentialRepository
    outbox: IOutboxRepository
}

export class SignInPasswordUserUseCase {
    private static readonly AUTH_METHOD: AuthMethod = 'password'

    constructor(
        private readonly passwordHasher: IPasswordHasher,
        private readonly unitOfWork: IUnitOfWorkWithRepos<SignInPasswordUserTxRepositories>,
        private readonly integrationEventFactory: IntegrationEventFactory,
        private readonly outboxEventFactory: OutboxEventFactory,
        private readonly eventPublisher: ApplicationEventPublisher,
        private readonly jwtTokenService: JwtTokenService
    ) { }

    async execute(
        input: SignInPasswordUserInput
    ): Promise<SignInPasswordUserOutput> {

        const email = EmailAddress.create(input.email)

        let appEvent: UserLoginSucceededEvent | UserLoginFailedEvent | null = null
        let accessToken: string | null = null
        let userId: string | null = null
        let failureReason: AuthFailureReason | null = null

        // ================================
        // 1️⃣ 認証 + Outbox確定（同一トランザクション）
        // - 失敗でも監査向けOutboxは確定させたい
        //   -> tx内でthrowしない（throwするとOutboxもrollbackされる）
        // ================================
        await this.unitOfWork.run(async (repos) => {
            // 1️⃣ User 取得
            const user = await repos.user.findByEmail(input.email)

            if (!user) {
                const failed = new UserLoginFailedEvent({
                    email,
                    reason: 'USER_NOT_FOUND',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    ipAddress: input.ipAddress,
                })

                const integrationEvents =
                    this.integrationEventFactory.createManyFrom(failed)
                const outboxEvents =
                    this.outboxEventFactory.createManyFrom(integrationEvents)
                await repos.outbox.saveMany(outboxEvents)

                appEvent = failed
                failureReason = 'USER_NOT_FOUND'
                return
            }

            // 2️⃣ Credential 取得
            const credential = await repos.credential.findByUserId(user.getId())

            if (!credential) {
                const failed = new UserLoginFailedEvent({
                    email: user.getEmail()!,
                    reason: 'CREDENTIAL_NOT_FOUND',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    userId: user.getId(),
                    ipAddress: input.ipAddress,
                })

                const integrationEvents =
                    this.integrationEventFactory.createManyFrom(failed)
                const outboxEvents =
                    this.outboxEventFactory.createManyFrom(integrationEvents)
                await repos.outbox.saveMany(outboxEvents)

                appEvent = failed
                failureReason = 'CREDENTIAL_NOT_FOUND'
                return
            }

            // 3️⃣ パスワード検証
            const ok = await credential.verify(
                PlainPassword.create(input.password),
                this.passwordHasher
            )

            if (!ok) {
                const failed = new UserLoginFailedEvent({
                    email: user.getEmail()!,
                    reason: 'INVALID_CREDENTIALS',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    userId: user.getId(),
                    ipAddress: input.ipAddress,
                })

                const integrationEvents =
                    this.integrationEventFactory.createManyFrom(failed)
                const outboxEvents =
                    this.outboxEventFactory.createManyFrom(integrationEvents)
                await repos.outbox.saveMany(outboxEvents)

                appEvent = failed
                failureReason = 'INVALID_CREDENTIALS'
                return
            }

            // 4️⃣ 認証成功 → JWT発行
            const generatedAccessToken = this.jwtTokenService.generate(
                user.getId().getValue(),
                user.getEmail()?.getValue()!
            )

            logger.info('JWT token generated')

            const succeeded = new UserLoginSucceededEvent({
                userId: user.getId(),
                email: user.getEmail()!,
                method: SignInPasswordUserUseCase.AUTH_METHOD,
                ipAddress: input.ipAddress,
            })

            const integrationEvents =
                this.integrationEventFactory.createManyFrom(succeeded)
            const outboxEvents =
                this.outboxEventFactory.createManyFrom(integrationEvents)
            await repos.outbox.saveMany(outboxEvents)

            appEvent = succeeded
            userId = user.getId().getValue()
            accessToken = generatedAccessToken
        })

        if (!appEvent) {
            throw new Error('Unexpected authentication state')
        }

        // ================================
        // 2️⃣ commit後: publish-only（in-process副作用のみ）
        // ================================
        await this.eventPublisher.publish(appEvent)

        if (failureReason) {
            throw new AuthenticationFailedError({ reason: failureReason })
        }

        if (!userId || !accessToken) {
            throw new Error('Unexpected authentication success state')
        }

        return {
            userId,
            accessToken,
        }
    }
}
