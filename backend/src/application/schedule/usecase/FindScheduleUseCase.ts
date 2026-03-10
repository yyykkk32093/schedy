import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { ScheduleNotFoundError } from '../error/ScheduleNotFoundError.js'

export type MyScheduleStatus = 'none' | 'attending' | 'waitlisted'

export class FindScheduleUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly activityRepository: IActivityRepository,
        private readonly participationRepository: IParticipationRepository,
        private readonly waitlistEntryRepository: IWaitlistEntryRepository,
    ) { }

    async execute(input: { scheduleId: string; userId?: string }): Promise<{
        id: string
        activityId: string
        communityId: string
        date: string
        startTime: string
        endTime: string
        location: string | null
        note: string | null
        status: string
        capacity: number | null
        participationFee: number | null
        isOnline: boolean
        meetingUrl: string | null
        myStatus: MyScheduleStatus
        attendingCount: number
        waitlistCount: number
    }> {
        const schedule = await this.scheduleRepository.findById(input.scheduleId)
        if (!schedule) throw new ScheduleNotFoundError()

        const scheduleId = schedule.getId().getValue()
        const activity = await this.activityRepository.findById(schedule.getActivityId().getValue())

        // 参加状態・人数の取得（並列）
        const [attendingCount, waitlistCount, participation, waitlistEntry] = await Promise.all([
            this.participationRepository.countAttending(scheduleId),
            this.waitlistEntryRepository.countWaiting(scheduleId),
            input.userId
                ? this.participationRepository.findByScheduleAndUser(scheduleId, input.userId)
                : Promise.resolve(null),
            input.userId
                ? this.waitlistEntryRepository.findByScheduleAndUser(scheduleId, input.userId)
                : Promise.resolve(null),
        ])

        let myStatus: MyScheduleStatus = 'none'
        if (participation && participation.isAttending()) myStatus = 'attending'
        else if (waitlistEntry && waitlistEntry.isWaiting()) myStatus = 'waitlisted'

        return {
            id: scheduleId,
            activityId: schedule.getActivityId().getValue(),
            communityId: activity?.getCommunityId().getValue() ?? '',
            date: schedule.getDate().toISOString().split('T')[0],
            startTime: schedule.getStartTime().getValue(),
            endTime: schedule.getEndTime().getValue(),
            location: schedule.getLocation(),
            note: schedule.getNote(),
            status: schedule.getStatus().getValue(),
            capacity: schedule.getCapacity().getValue(),
            participationFee: schedule.getParticipationFee(),
            isOnline: schedule.getIsOnline(),
            meetingUrl: schedule.getMeetingUrl(),
            myStatus,
            attendingCount,
            waitlistCount,
        }
    }
}
