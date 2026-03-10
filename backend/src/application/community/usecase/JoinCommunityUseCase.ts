import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityMembership } from '@/domains/community/membership/domain/model/entity/CommunityMembership.js'
import { MembershipId } from '@/domains/community/membership/domain/model/valueObject/MembershipId.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'

export type JoinCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
}

/**
 * JoinCommunityUseCase — joinMethod=FREE_JOIN のコミュニティに即参加
 */
export class JoinCommunityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<JoinCommunityTxRepositories>,
    ) { }

    async execute(input: { communityId: string; userId: string }): Promise<{ membershipId: string }> {
        let membershipIdStr = ''

        await this.unitOfWork.run(async (repos) => {
            // コミュニティ存在確認
            const community = await repos.community.findById(input.communityId)
            if (!community || community.getDeletedAt()) {
                throw new CommunityNotFoundError()
            }

            // 公開 & FREE_JOIN のみ
            if (!community.getIsPublic()) {
                throw new HttpError({ statusCode: 403, code: 'NOT_PUBLIC', message: 'このコミュニティは公開されていません' })
            }
            if (community.getJoinMethod().getValue() !== 'FREE_JOIN') {
                throw new HttpError({ statusCode: 403, code: 'NOT_FREE_JOIN', message: 'このコミュニティは自由参加ではありません' })
            }

            // 既に参加済みチェック
            const existing = await repos.membership.findByCommunityAndUser(input.communityId, input.userId)
            if (existing && !existing.getLeftAt()) {
                throw new HttpError({ statusCode: 409, code: 'ALREADY_MEMBER', message: '既にこのコミュニティのメンバーです' })
            }

            // 上限人数チェック
            const maxMembers = community.getMaxMembers()
            if (maxMembers) {
                const members = await repos.membership.findsByCommunityId(input.communityId)
                const activeCount = members.filter((m) => !m.getLeftAt()).length
                if (activeCount >= maxMembers) {
                    throw new HttpError({ statusCode: 409, code: 'COMMUNITY_FULL', message: 'コミュニティの上限人数に達しています' })
                }
            }

            // メンバーシップ作成
            const membershipId = MembershipId.create(this.idGenerator.generate())
            const membership = CommunityMembership.create({
                id: membershipId,
                communityId: CommunityId.create(input.communityId),
                userId: UserId.create(input.userId),
                role: MembershipRole.member(),
            })
            await repos.membership.save(membership)

            membershipIdStr = membershipId.getValue()
        })

        return { membershipId: membershipIdStr }
    }
}
