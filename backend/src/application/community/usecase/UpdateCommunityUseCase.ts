import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityAuditLog } from '@/domains/community/auditLog/domain/model/entity/CommunityAuditLog.js'
import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js'
import { CommunityDescription } from '@/domains/community/domain/model/valueObject/CommunityDescription.js'
import { CommunityName } from '@/domains/community/domain/model/valueObject/CommunityName.js'
import { JoinMethod } from '@/domains/community/domain/model/valueObject/JoinMethod.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type UpdateCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    auditLog: ICommunityAuditLogRepository
}

export class UpdateCommunityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateCommunityTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
        name?: string
        description?: string | null
        logoUrl?: string | null
        coverUrl?: string | null
        payPayId?: string | null
        enabledPaymentMethods?: string[]
        reminderEnabled?: boolean
        cancellationAlertEnabled?: boolean
        joinMethod?: string
        isPublic?: boolean
        activityFrequency?: string | null
        targetGender?: string[]
        ageMin?: number | null
        ageMax?: number | null
        categoryId?: string | null
        recommendedLevelMin?: number | null
        recommendedLevelMax?: number | null
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            // 権限チェック: ADMIN 以上が更新可
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new CommunityPermissionError('コミュニティの更新は管理者以上のみ実行できます')
            }

            // 変更前の値を保持して監査ログ用
            const changes: Array<{ field: string; before: string | null; after: string | null }> = []

            if (input.name !== undefined && input.name !== community.getName().getValue()) {
                changes.push({ field: 'name', before: community.getName().getValue(), after: input.name })
            }
            if (input.description !== undefined) {
                const before = community.getDescription()?.getValue() ?? null
                if (before !== input.description) {
                    changes.push({ field: 'description', before, after: input.description })
                }
            }
            if (input.logoUrl !== undefined && input.logoUrl !== community.getLogoUrl()) {
                changes.push({ field: 'logoUrl', before: community.getLogoUrl(), after: input.logoUrl })
            }
            if (input.coverUrl !== undefined && input.coverUrl !== community.getCoverUrl()) {
                changes.push({ field: 'coverUrl', before: community.getCoverUrl(), after: input.coverUrl })
            }
            if (input.payPayId !== undefined && input.payPayId !== community.getPayPayId()) {
                changes.push({ field: 'payPayId', before: community.getPayPayId(), after: input.payPayId })
            }
            if (input.enabledPaymentMethods !== undefined) {
                const beforeMethods = community.getEnabledPaymentMethods().join(',')
                const afterMethods = input.enabledPaymentMethods.join(',')
                if (beforeMethods !== afterMethods) {
                    changes.push({ field: 'enabledPaymentMethods', before: beforeMethods, after: afterMethods })
                }
            }
            if (input.reminderEnabled !== undefined && input.reminderEnabled !== community.getReminderEnabled()) {
                changes.push({ field: 'reminderEnabled', before: String(community.getReminderEnabled()), after: String(input.reminderEnabled) })
            }
            if (input.cancellationAlertEnabled !== undefined && input.cancellationAlertEnabled !== community.getCancellationAlertEnabled()) {
                changes.push({ field: 'cancellationAlertEnabled', before: String(community.getCancellationAlertEnabled()), after: String(input.cancellationAlertEnabled) })
            }
            if (input.joinMethod !== undefined && input.joinMethod !== community.getJoinMethod().getValue()) {
                changes.push({ field: 'joinMethod', before: community.getJoinMethod().getValue(), after: input.joinMethod })
            }
            if (input.isPublic !== undefined && input.isPublic !== community.getIsPublic()) {
                changes.push({ field: 'isPublic', before: String(community.getIsPublic()), after: String(input.isPublic) })
            }
            if (input.activityFrequency !== undefined && input.activityFrequency !== community.getActivityFrequency()) {
                changes.push({ field: 'activityFrequency', before: community.getActivityFrequency(), after: input.activityFrequency })
            }
            if (input.targetGender !== undefined) {
                const beforeGender = community.getTargetGender().join(',')
                const afterGender = input.targetGender.join(',')
                if (beforeGender !== afterGender) {
                    changes.push({ field: 'targetGender', before: beforeGender, after: afterGender })
                }
            }
            if (input.ageMin !== undefined && input.ageMin !== community.getAgeMin()) {
                changes.push({ field: 'ageMin', before: String(community.getAgeMin() ?? ''), after: String(input.ageMin ?? '') })
            }
            if (input.ageMax !== undefined && input.ageMax !== community.getAgeMax()) {
                changes.push({ field: 'ageMax', before: String(community.getAgeMax() ?? ''), after: String(input.ageMax ?? '') })
            }
            if (input.categoryId !== undefined && input.categoryId !== community.getCategoryId()) {
                changes.push({ field: 'categoryId', before: community.getCategoryId(), after: input.categoryId })
            }
            if (input.recommendedLevelMin !== undefined && input.recommendedLevelMin !== community.getRecommendedLevelMin()) {
                changes.push({ field: 'recommendedLevelMin', before: String(community.getRecommendedLevelMin() ?? ''), after: String(input.recommendedLevelMin ?? '') })
            }
            if (input.recommendedLevelMax !== undefined && input.recommendedLevelMax !== community.getRecommendedLevelMax()) {
                changes.push({ field: 'recommendedLevelMax', before: String(community.getRecommendedLevelMax() ?? ''), after: String(input.recommendedLevelMax ?? '') })
            }

            community.update({
                name: input.name ? CommunityName.create(input.name) : undefined,
                description: input.description !== undefined
                    ? CommunityDescription.createNullable(input.description)
                    : undefined,
                logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
                coverUrl: input.coverUrl !== undefined ? input.coverUrl : undefined,
                payPayId: input.payPayId !== undefined ? input.payPayId : undefined,
                enabledPaymentMethods: input.enabledPaymentMethods,
                reminderEnabled: input.reminderEnabled,
                cancellationAlertEnabled: input.cancellationAlertEnabled,
                joinMethod: input.joinMethod ? JoinMethod.create(input.joinMethod) : undefined,
                isPublic: input.isPublic,
                activityFrequency: input.activityFrequency !== undefined ? input.activityFrequency : undefined,
                targetGender: input.targetGender,
                ageMin: input.ageMin !== undefined ? input.ageMin : undefined,
                ageMax: input.ageMax !== undefined ? input.ageMax : undefined,
                categoryId: input.categoryId !== undefined ? input.categoryId : undefined,
                recommendedLevelMin: input.recommendedLevelMin !== undefined ? input.recommendedLevelMin : undefined,
                recommendedLevelMax: input.recommendedLevelMax !== undefined ? input.recommendedLevelMax : undefined,
            })

            await repos.community.save(community)

            // 監査ログ記録
            for (const change of changes) {
                await repos.auditLog.save(new CommunityAuditLog({
                    communityId: input.communityId,
                    actorUserId: input.userId,
                    action: 'COMMUNITY_UPDATED',
                    field: change.field,
                    before: change.before,
                    after: change.after,
                    summary: `${change.field} を変更しました`,
                }))
            }
        })
    }
}
