import { LoginPasswordUserUseCase } from '@/application/auth/password/usecase/LoginPasswordUserUseCase.js'
import { PasswordUserRepositoryImpl } from '@/domains/auth/password/infrastructure/repository/PasswordUserRepositoryImpl.js'
import { authDomainEventBus } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEventBus.js'
import { BcryptPasswordHasher } from '@/domains/auth/sharedAuth/infrastructure/security/BcryptPasswordHasher.js'

export const usecaseFactory = {
    createLoginPasswordUserUseCase() {
        return new LoginPasswordUserUseCase(
            new PasswordUserRepositoryImpl(),
            new BcryptPasswordHasher(),
            authDomainEventBus
        )
    },
}
