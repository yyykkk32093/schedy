import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'

export class ListSchedulesUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly participationRepository: IParticipationRepository,
    ) { }

    async execute(input: { activityId: string }): Promise<{
        schedules: Array<{
            id: string
            activityId: string
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
            participantCount: number
        }>
    }> {
        const schedules = await this.scheduleRepository.findsByActivityId(input.activityId)

        // 参加人数を並列取得
        const counts = await Promise.all(
            schedules.map((s) => this.participationRepository.count(s.getId().getValue()))
        )

        return {
            schedules: schedules.map((s, i) => ({
                id: s.getId().getValue(),
                activityId: s.getActivityId().getValue(),
                date: s.getDate().toISOString().split('T')[0],
                startTime: s.getStartTime().getValue(),
                endTime: s.getEndTime().getValue(),
                location: s.getLocation(),
                note: s.getNote(),
                status: s.getStatus().getValue(),
                capacity: s.getCapacity().getValue(),
                participationFee: s.getParticipationFee(),
                isOnline: s.getIsOnline(),
                meetingUrl: s.getMeetingUrl(),
                participantCount: counts[i],
            })),
        }
    }
}
