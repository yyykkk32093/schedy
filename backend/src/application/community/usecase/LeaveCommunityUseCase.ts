import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { MembershipNotFoundError } from '../error/MembershipNotFoundError.js'

export type LeaveCommunityTxRepositories = {
    membership: ICommunityMembershipRepository
}

export class LeaveCommunityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<LeaveCommunityTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive()) {
                throw new MembershipNotFoundError()
            }

            // OWNER 脱退チェックはドメイン層（CommunityMembership.leave()）で実施
            membership.leave()
            await repos.membership.save(membership)
        })
    }
}
