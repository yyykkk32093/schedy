import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IInviteTokenRepository } from '@/domains/community/invite/domain/repository/IInviteTokenRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { randomBytes } from 'crypto'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

/**
 * GenerateInviteTokenUseCase — 招待リンク生成（UBL-11）
 *
 * ADMIN以上が実行可能。トークンは7日間有効。
 */
export class GenerateInviteTokenUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly membershipRepository: ICommunityMembershipRepository,
        private readonly inviteTokenRepository: IInviteTokenRepository,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
        expiresInDays?: number
    }): Promise<{ token: string; expiresAt: Date }> {
        // 権限チェック: ADMIN 以上
        const membership = await this.membershipRepository.findByCommunityAndUser(
            input.communityId, input.userId,
        )
        if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
            throw new CommunityPermissionError('招待リンクの生成は管理者以上のみ実行できます')
        }

        const id = this.idGenerator.generate()
        const token = randomBytes(24).toString('base64url')
        const daysValid = input.expiresInDays ?? 7
        const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)

        await this.inviteTokenRepository.save({
            id,
            communityId: input.communityId,
            token,
            createdBy: input.userId,
            expiresAt,
        })

        return { token, expiresAt }
    }
}
