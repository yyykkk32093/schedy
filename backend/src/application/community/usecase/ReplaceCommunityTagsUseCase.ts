import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityLimitKey } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import type { FeatureGateService } from '@/domains/_sharedDomains/featureGate/FeatureGateService.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityTagRepository } from '@/domains/community/domain/repository/ICommunityTagRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type ReplaceCommunityTagsTxRepositories = {
    membership: ICommunityMembershipRepository
    tag: ICommunityTagRepository
}

export type ReplaceCommunityTagsInput = {
    communityId: string
    userId: string
    tags: string[]
}

/**
 * コミュニティのタグを一括置換する。
 * OWNER/ADMIN のみ実行可能。コミュニティグレードに応じた上限チェックあり。
 */
export class ReplaceCommunityTagsUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<ReplaceCommunityTagsTxRepositories>,
        private readonly communityRepository: ICommunityRepository,
        private readonly featureGateService: FeatureGateService,
    ) { }

    async execute(input: ReplaceCommunityTagsInput): Promise<{ tags: string[] }> {
        const uniqueTags = [...new Set(input.tags.map(t => t.trim()).filter(Boolean))]

        const community = await this.communityRepository.findGrade(input.communityId)
        if (!community) {
            throw new HttpError({
                statusCode: 404,
                code: 'NOT_FOUND',
                message: 'コミュニティが見つかりません',
            })
        }

        const maxTags = await this.featureGateService.getCommunityLimit(
            community.grade,
            CommunityLimitKey.MAX_TAGS,
        )
        if (maxTags !== -1 && uniqueTags.length > maxTags) {
            throw new HttpError({
                statusCode: 400,
                code: 'TAG_LIMIT_EXCEEDED',
                message: `タグ数が上限を超えています（上限: ${maxTags}件、指定: ${uniqueTags.length}件）`,
            })
        }

        await this.unitOfWork.run(async (repos) => {
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId,
                input.userId,
            )
            if (!membership || !membership.isActive()) {
                throw new CommunityPermissionError('コミュニティに所属していません')
            }
            const role = membership.getRole()
            if (!role.isOwner() && !role.isAdmin()) {
                throw new CommunityPermissionError('管理者以上の権限が必要です')
            }

            await repos.tag.deleteAllByCommunityId(input.communityId)
            await repos.tag.createMany(input.communityId, uniqueTags)
        })

        return { tags: uniqueTags }
    }
}
