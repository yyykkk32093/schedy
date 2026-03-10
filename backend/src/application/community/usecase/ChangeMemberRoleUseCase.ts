import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityGradePolicy } from '@/domains/community/domain/service/CommunityGradePolicy.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'
import { MembershipNotFoundError } from '../error/MembershipNotFoundError.js'

export type ChangeMemberRoleTxRepositories = {
    membership: ICommunityMembershipRepository
    community: ICommunityRepository
    user: IUserRepository
    auditLog: ICommunityAuditLogRepository
}

export class ChangeMemberRoleUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<ChangeMemberRoleTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        targetUserId: string
        requesterId: string
        newRole: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // リクエスト者の権限チェック
            const requester = await repos.membership.findByCommunityAndUser(
                input.communityId, input.requesterId
            )
            if (!requester || !requester.isActive() || !requester.getRole().isOwner()) {
                throw new CommunityPermissionError('ロール変更はOWNERのみ実行できます')
            }

            // 対象メンバーの取得
            const target = await repos.membership.findByCommunityAndUser(
                input.communityId, input.targetUserId
            )
            if (!target || !target.isActive()) {
                throw new MembershipNotFoundError()
            }

            const oldRole = target.getRole().getValue()
            const newRole = MembershipRole.create(input.newRole)

            // OWNER 委譲: 新 OWNER に昇格 + 旧 OWNER を ADMIN に降格 + grade 再評価
            if (newRole.isOwner()) {
                target.changeRole(MembershipRole.owner())
                requester.changeRole(MembershipRole.admin())
                await repos.membership.save(target)
                await repos.membership.save(requester)

                // 新 OWNER の plan に基づいて grade を再評価
                const community = await repos.community.findById(input.communityId)
                if (!community) throw new CommunityNotFoundError()
                const newOwnerUser = await repos.user.findById(input.targetUserId)
                if (!newOwnerUser) throw new Error('User not found')
                const newGrade = CommunityGradePolicy.gradeFromPlan(newOwnerUser.getPlan())
                community.changeGrade(newGrade)
                await repos.community.save(community)

                // 監査ログ: OWNER 委譲
                await repos.auditLog.save({
                    communityId: input.communityId,
                    actorUserId: input.requesterId,
                    action: 'OWNER_TRANSFERRED',
                    field: 'owner',
                    before: input.requesterId,
                    after: input.targetUserId,
                    summary: `OWNERを委譲しました (userId: ${input.targetUserId})`,
                })
                return
            }

            // 通常のロール変更
            target.changeRole(newRole)
            await repos.membership.save(target)

            // 監査ログ: ロール変更
            await repos.auditLog.save({
                communityId: input.communityId,
                actorUserId: input.requesterId,
                action: 'ROLE_CHANGED',
                field: 'role',
                before: oldRole,
                after: input.newRole,
                summary: `メンバーのロールを ${oldRole} → ${input.newRole} に変更しました (userId: ${input.targetUserId})`,
            })
        })
    }
}
