import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { ActivityNotFoundError } from '../error/ActivityNotFoundError.js'
import { ActivityPermissionError } from '../error/ActivityPermissionError.js'

export type SoftDeleteActivityTxRepositories = {
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
}

export class SoftDeleteActivityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<SoftDeleteActivityTxRepositories>,
    ) { }

    async execute(input: {
        activityId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const activity = await repos.activity.findById(input.activityId)
            if (!activity) throw new ActivityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ削除可
            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new ActivityPermissionError('アクティビティの削除はOWNERまたはADMINのみ実行できます')
            }

            activity.softDelete()
            await repos.activity.save(activity)
        })
    }
}
