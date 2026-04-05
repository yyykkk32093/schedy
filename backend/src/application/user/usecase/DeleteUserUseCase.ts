import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IAppleCredentialRepository } from '@/domains/auth/oauth/domain/repository/IAppleCredentialRepository.js'
import type { IGoogleCredentialRepository } from '@/domains/auth/oauth/domain/repository/IGoogleCredentialRepository.js'
import type { ILineCredentialRepository } from '@/domains/auth/oauth/domain/repository/ILineCredentialRepository.js'
import type { IPasswordCredentialRepository } from '@/domains/auth/password/domain/repository/IPasswordCredentialRepository.js'
import type { IAuthSecurityStateRepository } from '@/domains/auth/security/domain/repository/IAuthSecurityStateRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { IUserWithdrawalRepository } from '@/domains/user/domain/repository/IUserWithdrawalRepository.js'

/** 退会理由の選択肢 */
export type WithdrawalReason = 'NOT_USING' | 'FOUND_ALTERNATIVE' | 'HARD_TO_USE' | 'FEE_TOO_HIGH' | 'OTHER'

export type DeleteUserTxRepositories = {
    user: IUserRepository
    passwordCredential: IPasswordCredentialRepository
    googleCredential: IGoogleCredentialRepository
    lineCredential: ILineCredentialRepository
    appleCredential: IAppleCredentialRepository
    authSecurityState: IAuthSecurityStateRepository
    userWithdrawal: IUserWithdrawalRepository
}

/**
 * ユーザー退会 UseCase
 *
 * D-P2-9: 論理削除（User.deletedAt 設定）+ 認証クレデンシャル物理削除
 * D-P2-10: JWT無効化はインメモリ blacklist で実施（authMiddleware 側）
 * C-25: 退会理由を UserWithdrawal テーブルに保存
 */
export class DeleteUserUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<DeleteUserTxRepositories>,
        private readonly addToBlacklist: (userId: string) => void,
    ) { }

    async execute(input: {
        userId: string
        reason?: WithdrawalReason
        freeText?: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // 1. ユーザー取得
            const user = await repos.user.findById(input.userId)
            if (!user || user.isDeleted()) {
                throw new Error('User not found or already deleted')
            }

            // 2. 論理削除
            user.softDelete()
            await repos.user.save(user)

            // 3. 退会理由を保存（C-25）
            if (input.reason) {
                await repos.userWithdrawal.upsert({
                    userId: input.userId,
                    reason: input.reason,
                    freeText: input.freeText ?? null,
                })
            }

            // 4. 認証クレデンシャルを物理削除（5テーブル）
            await Promise.all([
                repos.passwordCredential.deleteByUserId(input.userId),
                repos.googleCredential.deleteByUserId(input.userId),
                repos.lineCredential.deleteByUserId(input.userId),
                repos.appleCredential.deleteByUserId(input.userId),
                repos.authSecurityState.deleteByUserId(input.userId),
            ])
        })

        // 5. TX成功後にブラックリスト追加（再ログイン防止）
        this.addToBlacklist(input.userId)
    }
}
