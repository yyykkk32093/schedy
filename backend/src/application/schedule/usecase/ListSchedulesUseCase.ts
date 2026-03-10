import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'

export class ListSchedulesUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
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
        }>
    }> {
        const schedules = await this.scheduleRepository.findsByActivityId(input.activityId)

        return {
            schedules: schedules.map((s) => ({
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
            })),
        }
    }
}
