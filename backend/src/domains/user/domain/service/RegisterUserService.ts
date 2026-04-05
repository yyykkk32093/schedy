// src/domains/user/domain/service/RegisterUserService.ts

import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import type { AuthMethod } from '@/domains/_sharedDomains/domain/model/valueObject/AuthMethod.js'
import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { User } from '@/domains/user/domain/model/entity/User.js'
import { DisplayName } from '@/domains/user/domain/model/valueObject/DisplayName.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export type RegisterUserTxRepositories = {
    user: IUserRepository
}

/**
 * ユーザー登録ドメインサービス
 *
 * 単一エンティティに属さないビジネスロジック（メール一意性チェック + User 生成）を
 * ドメインサービスとして表現する。
 *
 * - リポジトリはメソッド引数で注入（UoW の repos から）
 * - トランザクション管理は行わない（UseCase / UoW の責務）
 * - 外部サービスには依存しない
 * - ステートレス
 */
export class RegisterUserService {
    constructor() { }

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
                    : new DomainValidationError(
                        'このメールアドレスは既に使用されています',
                        'EMAIL_ALREADY_IN_USE'
                    )
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

        return { user, domainEvents }
    }

    static toEmailAddressNullable(value: string | null | undefined): EmailAddress | null {
        if (value == null || value === '') {
            return null
        }
        return EmailAddress.create(value)
    }
}
