import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { ScheduleNotFoundError } from '../error/ScheduleNotFoundError.js'

export class FindScheduleUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
    ) { }

    async execute(input: { scheduleId: string }): Promise<{
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
    }> {
        const schedule = await this.scheduleRepository.findById(input.scheduleId)
        if (!schedule) throw new ScheduleNotFoundError()

        return {
            id: schedule.getId().getValue(),
            activityId: schedule.getActivityId().getValue(),
            date: schedule.getDate().toISOString().split('T')[0],
            startTime: schedule.getStartTime().getValue(),
            endTime: schedule.getEndTime().getValue(),
            location: schedule.getLocation(),
            note: schedule.getNote(),
            status: schedule.getStatus().getValue(),
            capacity: schedule.getCapacity().getValue(),
            participationFee: schedule.getParticipationFee(),
        }
    }
}
