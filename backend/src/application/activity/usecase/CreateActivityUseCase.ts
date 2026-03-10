import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityNotFoundError } from '@/application/community/error/CommunityNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { Activity } from '@/domains/activity/domain/model/entity/Activity.js'
import { ActivityDescription } from '@/domains/activity/domain/model/valueObject/ActivityDescription.js'
import { ActivityId } from '@/domains/activity/domain/model/valueObject/ActivityId.js'
import { ActivityTitle } from '@/domains/activity/domain/model/valueObject/ActivityTitle.js'
import { DefaultLocation } from '@/domains/activity/domain/model/valueObject/DefaultLocation.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import { Schedule } from '@/domains/activity/schedule/domain/model/entity/Schedule.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { ActivityPermissionError } from '../error/ActivityPermissionError.js'

export type CreateActivityTxRepositories = {
    activity: IActivityRepository
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    schedule: IScheduleRepository
}

export class CreateActivityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateActivityTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        title: string
        description?: string | null
        defaultLocation?: string | null
        defaultAddress?: string | null
        defaultStartTime?: string | null
        defaultEndTime?: string | null
        recurrenceRule?: string | null
        organizerUserId?: string | null
        date?: string | null          // 初回 Schedule の開催日 (YYYY-MM-DD)。Activity の属性ではない
        participationFee?: number | null
        isOnline?: boolean
        meetingUrl?: string | null
        capacity?: number | null
        userId: string
    }): Promise<{ activityId: string }> {
        let activityId = ''

        await this.unitOfWork.run(async (repos) => {
            // コミュニティ存在チェック
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ作成可
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new ActivityPermissionError('アクティビティの作成はOWNERまたはADMINのみ実行できます')
            }

            const id = ActivityId.create(this.idGenerator.generate())
            const activity = Activity.create({
                id,
                communityId: CommunityId.create(input.communityId),
                title: ActivityTitle.create(input.title),
                description: ActivityDescription.createNullable(input.description),
                defaultLocation: DefaultLocation.createNullable(input.defaultLocation),
                defaultAddress: input.defaultAddress ?? null,
                defaultStartTime: TimeOfDay.createNullable(input.defaultStartTime),
                defaultEndTime: TimeOfDay.createNullable(input.defaultEndTime),
                recurrenceRule: input.recurrenceRule ?? null,
                organizerUserId: input.organizerUserId ? UserId.create(input.organizerUserId) : null,
                createdBy: UserId.create(input.userId),
            })

            await repos.activity.save(activity)
            activityId = id.getValue()

            // 日付が指定されていれば初回スケジュールを同一トランザクション内で作成
            if (input.date) {
                const scheduleId = ScheduleId.create(this.idGenerator.generate())
                const schedule = Schedule.create({
                    id: scheduleId,
                    activityId: id,
                    date: new Date(input.date),
                    startTime: TimeOfDay.create(input.defaultStartTime ?? '09:00'),
                    endTime: TimeOfDay.create(input.defaultEndTime ?? '10:00'),
                    location: input.defaultLocation ?? null,
                    participationFee: input.participationFee ?? null,
                    isOnline: input.isOnline ?? false,
                    meetingUrl: input.meetingUrl ?? null,
                    capacity: input.capacity ?? null,
                })
                await repos.schedule.save(schedule)
            }
        })

        return { activityId }
    }
}
