import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type SoftDeleteCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
}

export class SoftDeleteCommunityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<SoftDeleteCommunityTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            // OWNER のみ削除可
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().isOwner()) {
                throw new CommunityPermissionError('コミュニティの削除はOWNERのみ実行できます')
            }

            community.softDelete()
            await repos.community.save(community)
        })
    }
}
