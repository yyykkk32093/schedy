// src/application/auth/password/usecase/SignInPasswordUserUseCase.ts

import { logger } from '@/_sharedTech/logger/logger.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { ApplicationEventPublisher } from '@/application/_sharedApplication/event/ApplicationEventPublisher.js'
import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { PlainPassword } from '@/domains/auth/_sharedAuth/model/valueObject/PlainPassword.js'
import { IPasswordHasher } from '@/domains/auth/_sharedAuth/service/security/IPasswordHasher.js'
import { IPasswordCredentialRepository } from '@/domains/auth/password/domain/repository/IPasswordCredentialRepository.js'
import { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import { AuthMethod } from '../../model/AuthMethod.js'
import {
    SignInPasswordUserInput,
    SignInPasswordUserOutput,
} from '../dto/SignInPasswordUserDTO.js'
export class SignInPasswordUserUseCase {
    private static readonly AUTH_METHOD: AuthMethod = 'password'

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly credentialRepository: IPasswordCredentialRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly eventPublisher: ApplicationEventPublisher,
        private readonly jwtTokenService: JwtTokenService
    ) { }

    async execute(
        input: SignInPasswordUserInput
    ): Promise<SignInPasswordUserOutput> {

        // 1️⃣ User 取得
        const user = await this.userRepository.findByEmail(input.email)

        if (!user) {
            await this.eventPublisher.publish(
                new UserLoginFailedEvent({
                    email: EmailAddress.create(input.email),
                    reason: 'USER_NOT_FOUND',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    ipAddress: input.ipAddress,
                })
            )
            throw new Error('User not found')
        }


        // 2️⃣ Credential 取得
        const credential = await this.credentialRepository.findByUserId(
            user.getId()
        )
        logger.info(credential)
        if (!credential) {
            await this.eventPublisher.publish(
                new UserLoginFailedEvent({
                    email: user.getEmail()!,
                    reason: 'CREDENTIAL_NOT_FOUND',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    userId: user.getId(),
                    ipAddress: input.ipAddress,
                })
            )

            throw new Error('Credential not found')
        }

        // 3️⃣ パスワード検証
        const ok = await credential.verify(
            PlainPassword.create(input.password),
            this.passwordHasher
        )

        if (!ok) {
            await this.eventPublisher.publish(
                new UserLoginFailedEvent({
                    email: user.getEmail()!,
                    reason: 'INVALID_CREDENTIALS',
                    method: SignInPasswordUserUseCase.AUTH_METHOD,
                    userId: user.getId(),
                    ipAddress: input.ipAddress,
                })
            )
            throw new Error('Invalid credentials')
        }
        // 4️⃣ 認証成功 → JWT発行
        const accessToken = this.jwtTokenService.generate(
            user.getId().getValue(),
            user.getEmail()?.getValue()!
        )


        logger.info({ accessToken: accessToken }, 'JWT token generated');

        // 5️⃣ ApplicationEvent（成功）
        await this.eventPublisher.publish(
            new UserLoginSucceededEvent({
                userId: user.getId(),
                email: user.getEmail()!,
                method: SignInPasswordUserUseCase.AUTH_METHOD,
                ipAddress: input.ipAddress,
            })
        )


        return {
            userId: user.getId().getValue(),
            accessToken,
        }
    }
}
