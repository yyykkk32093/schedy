import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ActivityNotFoundError } from '@/application/activity/error/ActivityNotFoundError.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { ScheduleNotFoundError } from '../error/ScheduleNotFoundError.js'
import { SchedulePermissionError } from '../error/SchedulePermissionError.js'

export type UpdateScheduleTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
}

export class UpdateScheduleUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateScheduleTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
        date?: string
        startTime?: string
        endTime?: string
        location?: string | null
        note?: string | null
        capacity?: number | null
        participationFee?: number | null
        isOnline?: boolean
        meetingUrl?: string | null
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            // Activity 経由で communityId を取得 → 権限チェック
            const activity = await repos.activity.findById(schedule.getActivityId().getValue())
            if (!activity) throw new ActivityNotFoundError()

            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new SchedulePermissionError('スケジュールの更新はOWNERまたはADMINのみ実行できます')
            }

            schedule.update({
                date: input.date ? new Date(input.date) : undefined,
                startTime: input.startTime ? TimeOfDay.create(input.startTime) : undefined,
                endTime: input.endTime ? TimeOfDay.create(input.endTime) : undefined,
                location: input.location !== undefined ? input.location : undefined,
                note: input.note !== undefined ? input.note : undefined,
                capacity: input.capacity !== undefined ? input.capacity : undefined,
                participationFee: input.participationFee !== undefined ? input.participationFee : undefined,
                isOnline: input.isOnline !== undefined ? input.isOnline : undefined,
                meetingUrl: input.meetingUrl !== undefined ? input.meetingUrl : undefined,
            })

            await repos.schedule.save(schedule)
        })
    }
}
