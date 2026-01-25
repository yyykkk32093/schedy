import { logger } from '@/_sharedTech/logger/logger.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { ApplicationEventPublisher } from '@/application/_sharedApplication/event/ApplicationEventPublisher.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { AccountLinkRequiredError } from '@/application/auth/error/AccountLinkRequiredError.js'
import { OAuthAuthenticationFailedError } from '@/application/auth/error/OAuthAuthenticationFailedError.js'
import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import type { AuthMethod } from '@/application/auth/model/AuthMethod.js'
import type { SignInOAuthUserInput, SignInOAuthUserOutput } from '@/application/auth/oauth/dto/SignInOAuthUserDTO.js'
import { RegisterUserService } from '@/application/user/service/RegisterUserService.js'
import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import type { IAppleCredentialRepository } from '@/domains/auth/oauth/domain/repository/IAppleCredentialRepository.js'
import type { IGoogleCredentialRepository } from '@/domains/auth/oauth/domain/repository/IGoogleCredentialRepository.js'
import type { ILineCredentialRepository } from '@/domains/auth/oauth/domain/repository/ILineCredentialRepository.js'
import type { IAuthSecurityStateRepository } from '@/domains/auth/security/domain/repository/IAuthSecurityStateRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import { IOAuthProviderClient } from '@/integration/oauth/IOAuthProviderClient.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'

export type SignInOAuthUserTxRepositories = {
    user: IUserRepository
    authSecurityState: IAuthSecurityStateRepository
    outbox: IOutboxRepository
    googleCredential: IGoogleCredentialRepository
    lineCredential: ILineCredentialRepository
    appleCredential: IAppleCredentialRepository
}

export class SignInOAuthUserUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<SignInOAuthUserTxRepositories>,
        private readonly registerUserService: RegisterUserService,
        private readonly integrationEventFactory: IntegrationEventFactory,
        private readonly outboxEventFactory: OutboxEventFactory,
        private readonly eventPublisher: ApplicationEventPublisher,
        private readonly jwtTokenService: JwtTokenService,
        private readonly providerClients: Record<AuthMethod, IOAuthProviderClient | undefined>
    ) { }

    async execute(input: SignInOAuthUserInput): Promise<SignInOAuthUserOutput> {
        const providerClient = this.providerClients[input.provider]
        if (!providerClient) {
            throw new OAuthAuthenticationFailedError({ code: 'UNSUPPORTED_PROVIDER' })
        }

        let profile:
            | {
                providerUserId: string
                email?: string | null
                displayName?: string | null
            }
            | null = null

        try {
            profile = await providerClient.fetchProfile({
                code: input.code,
                redirectUri: input.redirectUri,
            })
        } catch (err) {
            logger.warn({ error: err, provider: input.provider }, '[OAuth] failed to fetch profile')

            // ================================
            // 失敗でも監査向けOutboxは確定させたい
            // ================================
            let appEvent: UserLoginFailedEvent | null = null
            await this.unitOfWork.run(async (repos) => {
                const failed = new UserLoginFailedEvent({
                    email: null,
                    reason: 'OAUTH_AUTHENTICATION_FAILED',
                    method: input.provider,
                    ipAddress: input.ipAddress,
                })

                const integrationEvents = this.integrationEventFactory.createManyFrom(failed)
                const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
                await repos.outbox.saveMany(outboxEvents)

                appEvent = failed
            })

            if (appEvent) {
                await this.eventPublisher.publish(appEvent)
            }

            throw new OAuthAuthenticationFailedError()
        }

        const email = RegisterUserService.toEmailAddressNullable(profile.email ?? null)

        let appEvent: UserLoginSucceededEvent | UserLoginFailedEvent | null = null
        let accessToken: string | null = null
        let userId: string | null = null
        let failure: Error | null = null

        await this.unitOfWork.run(async (repos) => {
            const existingUserIdByProvider = await this.findUserIdByProviderUid(
                repos,
                input.provider,
                profile.providerUserId
            )

            // 既存ログイン
            if (existingUserIdByProvider) {
                const user = await repos.user.findById(existingUserIdByProvider)
                if (!user) {
                    throw new Error('OAuth credential exists but user not found')
                }

                const securityState = await repos.authSecurityState.findByUserId({
                    userId: user.getId().getValue(),
                })

                if (securityState?.lockedUntil && securityState.lockedUntil > new Date()) {
                    const failed = new UserLoginFailedEvent({
                        email: user.getEmail() ?? null,
                        reason: 'LOCKED_ACCOUNT',
                        method: input.provider,
                        userId: user.getId(),
                        ipAddress: input.ipAddress,
                    })

                    const integrationEvents = this.integrationEventFactory.createManyFrom(failed)
                    const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
                    await repos.outbox.saveMany(outboxEvents)

                    appEvent = failed
                    failure = new OAuthAuthenticationFailedError({ code: 'LOCKED_ACCOUNT' })
                    return
                }

                const generatedAccessToken = this.jwtTokenService.generate(
                    user.getId().getValue(),
                    user.getEmail()?.getValue() ?? null
                )

                const succeeded = new UserLoginSucceededEvent({
                    userId: user.getId(),
                    email: user.getEmail() ?? null,
                    method: input.provider,
                    ipAddress: input.ipAddress,
                })

                const integrationEvents = this.integrationEventFactory.createManyFrom(succeeded)
                const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
                await repos.outbox.saveMany(outboxEvents)

                appEvent = succeeded
                userId = user.getId().getValue()
                accessToken = generatedAccessToken
                return
            }

            // 初回ログイン（＝自動signup）
            if (email) {
                const exists = await repos.user.findByEmail(email.getValue())
                if (exists) {
                    // 自動リンク禁止
                    throw new AccountLinkRequiredError()
                }
            }

            const newUserId = UserId.create(this.idGenerator.generate())

            const { user } = await this.registerUserService.register(
                {
                    userId: newUserId,
                    email,
                    displayName: null,
                    authMethod: input.provider,
                    onEmailAlreadyInUse: () => new AccountLinkRequiredError(),
                },
                repos,
                async (txRepos) => {
                    await this.linkCredentialByProviderUid(
                        txRepos,
                        input.provider,
                        newUserId.getValue(),
                        profile!.providerUserId
                    )
                }
            )

            const generatedAccessToken = this.jwtTokenService.generate(
                user.getId().getValue(),
                user.getEmail()?.getValue() ?? null
            )

            const succeeded = new UserLoginSucceededEvent({
                userId: user.getId(),
                email: user.getEmail() ?? null,
                method: input.provider,
                ipAddress: input.ipAddress,
            })

            const integrationEvents = this.integrationEventFactory.createManyFrom(succeeded)
            const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
            await repos.outbox.saveMany(outboxEvents)

            appEvent = succeeded
            userId = user.getId().getValue()
            accessToken = generatedAccessToken
        })

        if (!appEvent) {
            throw new Error('Unexpected authentication state')
        }

        await this.eventPublisher.publish(appEvent)

        if (failure) {
            throw failure
        }

        if (!userId || !accessToken) {
            throw new Error('Unexpected authentication success state')
        }

        return { userId, accessToken }
    }

    private async findUserIdByProviderUid(
        repos: SignInOAuthUserTxRepositories,
        provider: AuthMethod,
        providerUserId: string
    ): Promise<string | null> {
        switch (provider) {
            case 'google':
                return await repos.googleCredential.findUserIdByGoogleUid({
                    googleUid: providerUserId,
                })
            case 'line':
                return await repos.lineCredential.findUserIdByLineUid({
                    lineUid: providerUserId,
                })
            case 'apple':
                return await repos.appleCredential.findUserIdByAppleUid({
                    appleUid: providerUserId,
                })
            default:
                return null
        }
    }

    private async linkCredentialByProviderUid(
        repos: SignInOAuthUserTxRepositories,
        provider: AuthMethod,
        userId: string,
        providerUserId: string
    ): Promise<void> {
        switch (provider) {
            case 'google':
                await repos.googleCredential.link({
                    userId,
                    googleUid: providerUserId,
                })
                return
            case 'line':
                await repos.lineCredential.link({
                    userId,
                    lineUid: providerUserId,
                })
                return
            case 'apple':
                await repos.appleCredential.link({
                    userId,
                    appleUid: providerUserId,
                })
                return
            default:
                throw new Error('Unsupported provider')
        }
    }
}
