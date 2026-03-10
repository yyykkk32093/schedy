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
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'
import { MembershipAlreadyExistsError } from '../error/MembershipAlreadyExistsError.js'

export type AddMemberTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
}

export class AddMemberUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<AddMemberTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        targetUserId: string
        requesterId: string
    }): Promise<{ membershipId: string }> {
        let membershipId = ''

        await this.unitOfWork.run(async (repos) => {
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ追加可
            const requesterMembership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.requesterId
            )
            if (!requesterMembership || !requesterMembership.isActive() || !requesterMembership.getRole().canManageMembers()) {
                throw new CommunityPermissionError('メンバーの追加はOWNERまたはADMINのみ実行できます')
            }

            // 重複チェック
            const existing = await repos.membership.findByCommunityAndUser(
                input.communityId, input.targetUserId
            )
            if (existing && existing.isActive()) {
                throw new MembershipAlreadyExistsError()
            }

            const id = MembershipId.create(this.idGenerator.generate())
            const membership = CommunityMembership.create({
                id,
                communityId: CommunityId.create(input.communityId),
                userId: UserId.create(input.targetUserId),
                role: MembershipRole.member(),
            })
            await repos.membership.save(membership)
            membershipId = id.getValue()
        })

        return { membershipId }
    }
}
