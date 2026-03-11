import type { WaitlistEntry } from '../model/entity/WaitlistEntry.js'

export interface IWaitlistEntryRepository {
    findById(id: string): Promise<WaitlistEntry | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<WaitlistEntry | null>
    findNext(scheduleId: string): Promise<WaitlistEntry | null>
    findsByScheduleId(scheduleId: string): Promise<WaitlistEntry[]>
    count(scheduleId: string): Promise<number>
    add(entry: WaitlistEntry): Promise<void>
    delete(scheduleId: string, userId: string): Promise<void>
}
