import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { CommunityLimitKey } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import type { FeatureGateService } from '@/domains/_sharedDomains/featureGate/FeatureGateService.js'
import { CommunityAuditLog } from '@/domains/community/auditLog/domain/model/entity/CommunityAuditLog.js'
import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js'
import { CommunityDescription } from '@/domains/community/domain/model/valueObject/CommunityDescription.js'
import { CommunityName } from '@/domains/community/domain/model/valueObject/CommunityName.js'
import { JoinMethod } from '@/domains/community/domain/model/valueObject/JoinMethod.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { Prisma } from '@prisma/client'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type UpdateCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    auditLog: ICommunityAuditLogRepository
    tx: Prisma.TransactionClient
}

export class UpdateCommunityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateCommunityTxRepositories>,
        private readonly idGenerator: IIdGenerator,
        private readonly featureGateService: FeatureGateService,
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
        categoryIds?: string[]
        recommendedLevelMin?: number | null
        recommendedLevelMax?: number | null
        tags?: string[]
        locations?: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>
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
                recommendedLevelMin: input.recommendedLevelMin !== undefined ? input.recommendedLevelMin : undefined,
                recommendedLevelMax: input.recommendedLevelMax !== undefined ? input.recommendedLevelMax : undefined,
            })

            await repos.community.save(community)

            const { tx } = repos

            // カテゴリの結合テーブル同期（categoryIds 変更時に CommunityCategory を更新）
            if (input.categoryIds !== undefined) {
                const existingCategories = await tx.communityCategory.findMany({
                    where: { communityId: input.communityId },
                    select: { categoryId: true },
                })
                const beforeCategoryIds = existingCategories.map((c) => c.categoryId).sort().join(',')
                const afterCategoryIds = [...input.categoryIds].sort().join(',')
                if (beforeCategoryIds !== afterCategoryIds) {
                    changes.push({ field: 'categoryIds', before: beforeCategoryIds, after: afterCategoryIds })
                    await tx.communityCategory.deleteMany({ where: { communityId: input.communityId } })
                    if (input.categoryIds.length > 0) {
                        await tx.communityCategory.createMany({
                            data: input.categoryIds.map((categoryId) => ({
                                id: this.idGenerator.generate(),
                                communityId: input.communityId,
                                categoryId,
                            })),
                        })
                    }
                }
            }

            // タグの一括置き換え（undefined = 変更なし, [] = 全削除）
            if (input.tags !== undefined) {
                const grade = community.getGrade().getValue()
                const maxTags = await this.featureGateService.getCommunityLimit(
                    grade,
                    CommunityLimitKey.MAX_TAGS,
                )
                if (maxTags !== -1 && input.tags.length > maxTags) {
                    throw new Error(
                        `タグ数が上限を超えています（上限: ${maxTags}件、指定: ${input.tags.length}件）`,
                    )
                }

                // 変更前のタグを取得して監査ログ用
                const existingTags = await tx.communityTag.findMany({
                    where: { communityId: input.communityId },
                    select: { tag: true },
                })
                const beforeTags = existingTags.map((t) => t.tag).sort().join(',')
                const afterTags = [...input.tags].sort().join(',')
                if (beforeTags !== afterTags) {
                    changes.push({ field: 'tags', before: beforeTags, after: afterTags })
                }

                await tx.communityTag.deleteMany({ where: { communityId: input.communityId } })
                if (input.tags.length > 0) {
                    const uniqueTags = [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))]
                    await tx.communityTag.createMany({
                        data: uniqueTags.map((tag) => ({
                            id: this.idGenerator.generate(),
                            communityId: input.communityId,
                            tag,
                        })),
                    })
                }
            }

            // 活動拠点の一括置き換え（undefined = 変更なし, [] = 全削除）
            if (input.locations !== undefined) {
                const mainCount = input.locations.filter((l) => l.type === 'MAIN').length
                if (mainCount > 1) {
                    throw new Error('メイン拠点は最大1件です')
                }

                // 変更前の拠点を取得して監査ログ用
                const existingLocations = await tx.communityLocation.findMany({
                    where: { communityId: input.communityId },
                    select: { type: true, area: true, station: true },
                    orderBy: { sortOrder: 'asc' },
                })
                const beforeLocations = existingLocations.map((l) => `${l.type}:${l.area}:${l.station ?? ''}`).join('|')
                const afterLocations = input.locations.map((l) => `${l.type}:${l.area}:${l.station ?? ''}`).join('|')
                if (beforeLocations !== afterLocations) {
                    changes.push({ field: 'locations', before: beforeLocations, after: afterLocations })
                }

                await tx.communityLocation.deleteMany({ where: { communityId: input.communityId } })
                if (input.locations.length > 0) {
                    await tx.communityLocation.createMany({
                        data: input.locations.map((loc, i) => ({
                            id: this.idGenerator.generate(),
                            communityId: input.communityId,
                            type: loc.type,
                            area: loc.area.trim(),
                            station: loc.station?.trim() || null,
                            sortOrder: i,
                        })),
                    })
                }
            }

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
