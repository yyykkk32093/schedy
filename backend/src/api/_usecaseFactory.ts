// src/api/_usecaseFactory.ts
import { ApplicationEventBootstrap } from '@/_bootstrap/ApplicationEventBootstrap.js'
import { DomainEventBootstrap } from '@/_bootstrap/DomainEventBootstrap.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { PrismaUnitOfWork } from '@/application/_sharedApplication/uow/PrismaUnitOfWork.js'
import {
    SignInOAuthUserTxRepositories,
    SignInOAuthUserUseCase,
} from '@/application/auth/oauth/usecase/SignInOAuthUserUseCase.js'
import {
    SignInPasswordUserTxRepositories,
    SignInPasswordUserUseCase,
} from '@/application/auth/password/usecase/SignInPasswordUserUseCase.js'
import { RegisterUserService } from '@/application/user/service/RegisterUserService.js'
import { SignUpUserTxRepositories, SignUpUserUseCase } from '@/application/user/usecase/SignUpUserUseCase.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { BcryptPasswordHasher } from '@/domains/auth/_sharedAuth/infrastructure/security/BcryptPasswordHasher.js'
import { AppleCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/AppleCredentialRepositoryImpl.js'
import { GoogleCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/GoogleCredentialRepositoryImpl.js'
import { LineCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/LineCredentialRepositoryImpl.js'
import { PasswordCredentialRepositoryImpl } from '@/domains/auth/password/infrastructure/repository/PasswordCredentialRepositoryImpl.js'
import { AuthSecurityStateRepositoryImpl } from '@/domains/auth/security/infrastructure/repository/AuthSecurityStateRepositoryImpl.js'
import { UserRepositoryImpl } from '@/domains/user/infrastructure/repository/UserRepositoryImpl.js'
import { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import { AppleOAuthProviderClient } from '@/integration/oauth/AppleOAuthProviderClient.js'
import { GoogleOAuthProviderClient } from '@/integration/oauth/GoogleOAuthProviderClient.js'
import { LineOAuthProviderClient } from '@/integration/oauth/LineOAuthProviderClient.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'

export const usecaseFactory = {
    createSignInPasswordUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const unitOfWork = new PrismaUnitOfWork<SignInPasswordUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            authSecurityState: new AuthSecurityStateRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignInPasswordUserUseCase(
            new BcryptPasswordHasher(),
            unitOfWork,
            new IntegrationEventFactory(),
            new OutboxEventFactory(),
            ApplicationEventBootstrap.getEventBus(),
            new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret')
        )
    },

    createSignUpUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )

        const unitOfWork = new PrismaUnitOfWork<SignUpUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignUpUserUseCase(
            new BcryptPasswordHasher(),
            new UuidGenerator(),
            unitOfWork,
            registerUserService,
            new DomainEventFlusher(DomainEventBootstrap.getEventBus()),
            ApplicationEventBootstrap.getEventBus()
        )
    },

    createSignInOAuthUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )

        const unitOfWork = new PrismaUnitOfWork<SignInOAuthUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            authSecurityState: new AuthSecurityStateRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
            googleCredential: new GoogleCredentialRepositoryImpl(tx),
            lineCredential: new LineCredentialRepositoryImpl(tx),
            appleCredential: new AppleCredentialRepositoryImpl(tx),
        }))

        return new SignInOAuthUserUseCase(
            new UuidGenerator(),
            unitOfWork,
            registerUserService,
            integrationEventFactory,
            outboxEventFactory,
            ApplicationEventBootstrap.getEventBus(),
            new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret'),
            {
                password: undefined,
                google: new GoogleOAuthProviderClient(),
                line: new LineOAuthProviderClient(),
                apple: new AppleOAuthProviderClient(),
            }
        )
    },
}
