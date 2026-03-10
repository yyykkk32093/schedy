import type { Participation } from '../model/entity/Participation.js'

export interface IParticipationRepository {
    findById(id: string): Promise<Participation | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<Participation | null>
    findsByScheduleId(scheduleId: string): Promise<Participation[]>
    countAttending(scheduleId: string): Promise<number>
    save(participation: Participation): Promise<void>
}
