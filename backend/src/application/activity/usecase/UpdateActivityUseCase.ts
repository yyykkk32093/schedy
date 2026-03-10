import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ActivityDescription } from '@/domains/activity/domain/model/valueObject/ActivityDescription.js'
import { ActivityTitle } from '@/domains/activity/domain/model/valueObject/ActivityTitle.js'
import { DefaultLocation } from '@/domains/activity/domain/model/valueObject/DefaultLocation.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { ActivityNotFoundError } from '../error/ActivityNotFoundError.js'
import { ActivityPermissionError } from '../error/ActivityPermissionError.js'

export type UpdateActivityTxRepositories = {
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
}

export class UpdateActivityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateActivityTxRepositories>,
    ) { }

    async execute(input: {
        activityId: string
        userId: string
        title?: string
        description?: string | null
        defaultLocation?: string | null
        defaultAddress?: string | null
        defaultStartTime?: string | null
        defaultEndTime?: string | null
        recurrenceRule?: string | null
        organizerUserId?: string | null
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const activity = await repos.activity.findById(input.activityId)
            if (!activity) throw new ActivityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ更新可
            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new ActivityPermissionError('アクティビティの更新はOWNERまたはADMINのみ実行できます')
            }

            activity.update({
                title: input.title ? ActivityTitle.create(input.title) : undefined,
                description: input.description !== undefined
                    ? ActivityDescription.createNullable(input.description)
                    : undefined,
                defaultLocation: input.defaultLocation !== undefined
                    ? DefaultLocation.createNullable(input.defaultLocation)
                    : undefined,
                defaultAddress: input.defaultAddress !== undefined ? (input.defaultAddress || null) : undefined,
                defaultStartTime: input.defaultStartTime !== undefined
                    ? TimeOfDay.createNullable(input.defaultStartTime)
                    : undefined,
                defaultEndTime: input.defaultEndTime !== undefined
                    ? TimeOfDay.createNullable(input.defaultEndTime)
                    : undefined,
                recurrenceRule: input.recurrenceRule !== undefined ? input.recurrenceRule : undefined,
                organizerUserId: input.organizerUserId !== undefined
                    ? (input.organizerUserId ? UserId.create(input.organizerUserId) : null)
                    : undefined,
            })

            await repos.activity.save(activity)
        })
    }
}
