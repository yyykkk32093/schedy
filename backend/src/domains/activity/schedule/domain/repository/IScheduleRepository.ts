import type { Schedule } from '../model/entity/Schedule.js'

export interface IScheduleRepository {
    findById(id: string): Promise<Schedule | null>
    findsByActivityId(activityId: string): Promise<Schedule[]>
    findUpcomingByActivityIds(activityIds: string[]): Promise<Map<string, Schedule[]>>
    save(schedule: Schedule): Promise<void>
}
