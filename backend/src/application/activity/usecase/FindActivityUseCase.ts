import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import { ActivityNotFoundError } from '../error/ActivityNotFoundError.js'

export class FindActivityUseCase {
    constructor(
        private readonly activityRepository: IActivityRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: { activityId: string }): Promise<{
        id: string
        communityId: string
        title: string
        description: string | null
        defaultLocation: string | null
        defaultStartTime: string | null
        defaultEndTime: string | null
        recurrenceRule: string | null
        createdBy: string
        createdByDisplayName: string | null
    }> {
        const activity = await this.activityRepository.findById(input.activityId)
        if (!activity) throw new ActivityNotFoundError()

        const createdByUserId = activity.getCreatedBy().getValue()
        const user = await this.userRepository.findById(createdByUserId)

        return {
            id: activity.getId().getValue(),
            communityId: activity.getCommunityId().getValue(),
            title: activity.getTitle().getValue(),
            description: activity.getDescription()?.getValue() ?? null,
            defaultLocation: activity.getDefaultLocation()?.getValue() ?? null,
            defaultStartTime: activity.getDefaultStartTime()?.getValue() ?? null,
            defaultEndTime: activity.getDefaultEndTime()?.getValue() ?? null,
            recurrenceRule: activity.getRecurrenceRule(),
            createdBy: createdByUserId,
            createdByDisplayName: user?.getDisplayName()?.getValue() ?? null,
        }
    }
}
