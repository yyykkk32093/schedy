import type { Participation } from '../model/entity/Participation.js'

export interface IParticipationRepository {
    findById(id: string): Promise<Participation | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<Participation | null>
    findsByScheduleId(scheduleId: string): Promise<Participation[]>
    count(scheduleId: string): Promise<number>
    add(participation: Participation): Promise<void>
    update(participation: Participation): Promise<void>
    delete(scheduleId: string, userId: string): Promise<void>
}
