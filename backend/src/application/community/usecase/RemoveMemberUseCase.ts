import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityAuditLog } from '@/domains/community/auditLog/domain/model/entity/CommunityAuditLog.js'
import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'
import { MembershipNotFoundError } from '../error/MembershipNotFoundError.js'

export type RemoveMemberTxRepositories = {
    membership: ICommunityMembershipRepository
    auditLog: ICommunityAuditLogRepository
}

/**
 * RemoveMemberUseCase — メンバー強制退室（UBL-10 10-6）
 *
 * 管理者（ADMIN）以上が実行可能。OWNERは退室させられない。
 */
export class RemoveMemberUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<RemoveMemberTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        targetUserId: string
        requesterId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // リクエスト者の権限チェック: ADMIN 以上
            const requester = await repos.membership.findByCommunityAndUser(
                input.communityId, input.requesterId,
            )
            if (!requester || !requester.isActive() || !requester.getRole().canManageMembers()) {
                throw new CommunityPermissionError('メンバーの退室は管理者以上のみ実行できます')
            }

            // 対象メンバーの取得
            const target = await repos.membership.findByCommunityAndUser(
                input.communityId, input.targetUserId,
            )
            if (!target || !target.isActive()) {
                throw new MembershipNotFoundError()
            }

            // OWNERは退室させられない
            if (target.getRole().isOwner()) {
                throw new CommunityPermissionError('OWNERを退室させることはできません')
            }

            target.leave()
            await repos.membership.save(target)

            // 監査ログ
            await repos.auditLog.save(new CommunityAuditLog({
                communityId: input.communityId,
                actorUserId: input.requesterId,
                action: 'MEMBER_REMOVED',
                summary: `メンバーを退室させました (userId: ${input.targetUserId})`,
            }))
        })
    }
}
