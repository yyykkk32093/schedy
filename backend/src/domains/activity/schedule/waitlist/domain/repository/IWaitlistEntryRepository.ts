import type { WaitlistEntry } from '../model/entity/WaitlistEntry.js'

export interface IWaitlistEntryRepository {
    findById(id: string): Promise<WaitlistEntry | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<WaitlistEntry | null>
    findNextWaiting(scheduleId: string): Promise<WaitlistEntry | null>
    findsByScheduleId(scheduleId: string): Promise<WaitlistEntry[]>
    countWaiting(scheduleId: string): Promise<number>
    save(entry: WaitlistEntry): Promise<void>
}
