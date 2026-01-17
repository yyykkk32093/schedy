// src/api/_usecaseFactory.ts
import { ApplicationEventBootstrap } from '@/_bootstrap/ApplicationEventBootstrap.js'
import { DomainEventBootstrap } from '@/_bootstrap/DomainEventBootstrap.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { PrismaUnitOfWork } from '@/application/_sharedApplication/uow/PrismaUnitOfWork.js'
import {
    SignInPasswordUserTxRepositories,
    SignInPasswordUserUseCase,
} from '@/application/auth/password/usecase/SignInPasswordUserUseCase.js'
import { SignUpUserTxRepositories, SignUpUserUseCase } from '@/application/user/usecase/SignUpUserUseCase.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { BcryptPasswordHasher } from '@/domains/auth/_sharedAuth/infrastructure/security/BcryptPasswordHasher.js'
import { PasswordCredentialRepositoryImpl } from '@/domains/auth/password/infrastructure/repository/PasswordCredentialRepositoryImpl.js'
import { UserRepositoryImpl } from '@/domains/user/infrastructure/repository/UserRepositoryImpl.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'

export const usecaseFactory = {
    createSignInPasswordUserUseCase() {
        const unitOfWork = new PrismaUnitOfWork<SignInPasswordUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignInPasswordUserUseCase(
            new BcryptPasswordHasher(),
            unitOfWork,
            new OutboxEventFactory(),
            ApplicationEventBootstrap.getEventBus(),
            new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret')
        )
    },

    createSignUpUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const unitOfWork = new PrismaUnitOfWork<SignUpUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignUpUserUseCase(
            new BcryptPasswordHasher(),
            new UuidGenerator(),
            unitOfWork,
            new OutboxEventFactory(),
            new DomainEventFlusher(DomainEventBootstrap.getEventBus()),
            ApplicationEventBootstrap.getEventBus()
        )
    },
}
