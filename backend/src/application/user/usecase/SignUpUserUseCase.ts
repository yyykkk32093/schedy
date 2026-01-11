// src/application/user/signup/usecase/SignUpUserUseCase.ts

import { IPasswordHasher } from '@/domains/auth/_sharedAuth/service/security/IPasswordHasher.js'
import { IPasswordCredentialRepository } from '@/domains/auth/password/domain/repository/IPasswordCredentialRepository.js'
import { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

import { PasswordCredential } from '@/domains/auth/password/domain/model/entity/PasswordCredential.js'
import { User } from '@/domains/user/domain/model/entity/User.js'

import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { DisplayName } from '@/domains/user/domain/model/valueObject/DisplayName.js'

import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { IUnitOfWork } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { PlainPassword } from '@/domains/auth/_sharedAuth/model/valueObject/PlainPassword.js'

export class SignUpUserUseCase {

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly credentialRepository: IPasswordCredentialRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWork,
        private readonly domainEventFlusher: DomainEventFlusher, // ★ 追加
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
        // 2️⃣ 既存ユーザチェック
        // ================================
        const exists = await this.userRepository.findByEmail(email.getValue())
        if (exists) {
            throw new Error('Email already registered')
        }

        // ================================
        // 3️⃣ UserId 発番
        // ================================
        const userId = UserId.create(this.idGenerator.generate())

        // ================================
        // 4️⃣ Aggregate 生成
        // ================================
        const user = User.register({
            userId,
            email,
            displayName,
        })

        const hashedPassword = await this.passwordHasher.hash(
            PlainPassword.create(input.password)
        )

        const credential = PasswordCredential.create({
            userId: userId.getValue(),
            hashedPassword,
        })

        // ================================
        // 5️⃣ 永続化（トランザクション）
        // ================================
        await this.unitOfWork.run(async () => {
            await this.userRepository.save(user)
            await this.credentialRepository.save(credential)
        })

        // ================================
        // 6️⃣ DomainEvent flush（成功後のみ）
        // ================================
        await this.domainEventFlusher.flushFrom([user])

        return {
            userId: userId.getValue(),
        }
    }
}
