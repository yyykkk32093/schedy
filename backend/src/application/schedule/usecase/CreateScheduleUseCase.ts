import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ActivityNotFoundError } from '@/application/activity/error/ActivityNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { ActivityId } from '@/domains/activity/domain/model/valueObject/ActivityId.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import { Schedule } from '@/domains/activity/schedule/domain/model/entity/Schedule.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { SchedulePermissionError } from '../error/SchedulePermissionError.js'

export type CreateScheduleTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
}

export class CreateScheduleUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateScheduleTxRepositories>,
    ) { }

    async execute(input: {
        activityId: string
        date: string       // ISO date string (YYYY-MM-DD)
        startTime: string  // HH:mm
        endTime: string    // HH:mm
        location?: string | null
        note?: string | null
        capacity?: number | null
        participationFee?: number | null
        userId: string
    }): Promise<{ scheduleId: string }> {
        let scheduleId = ''

        await this.unitOfWork.run(async (repos) => {
            // Activity 存在チェック
            const activity = await repos.activity.findById(input.activityId)
            if (!activity) throw new ActivityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ作成可
            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new SchedulePermissionError('スケジュールの作成はOWNERまたはADMINのみ実行できます')
            }

            const id = ScheduleId.create(this.idGenerator.generate())
            const schedule = Schedule.create({
                id,
                activityId: ActivityId.create(input.activityId),
                date: new Date(input.date),
                startTime: TimeOfDay.create(input.startTime),
                endTime: TimeOfDay.create(input.endTime),
                location: input.location,
                note: input.note,
                capacity: input.capacity,
                participationFee: input.participationFee,
            })

            await repos.schedule.save(schedule)
            scheduleId = id.getValue()
        })

        return { scheduleId }
    }
}
