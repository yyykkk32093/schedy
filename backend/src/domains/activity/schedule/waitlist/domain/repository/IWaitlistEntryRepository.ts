import type { WaitlistEntry } from '../model/entity/WaitlistEntry.js'

export interface IWaitlistEntryRepository {
    findById(id: string): Promise<WaitlistEntry | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<WaitlistEntry | null>
    findNext(scheduleId: string): Promise<WaitlistEntry | null>
    findsByScheduleId(scheduleId: string): Promise<WaitlistEntry[]>
    count(scheduleId: string): Promise<number>
    /** 複数スケジュールの待機リスト人数を一括取得（GROUP BY scheduleId） */
    countByScheduleIds(scheduleIds: string[]): Promise<Map<string, number>>
    add(entry: WaitlistEntry): Promise<void>
    /** ID指定で削除（ビジター含む汎用削除） */
    deleteById(id: string): Promise<void>
    /** scheduleId + userId 複合キーで削除（登録ユーザー用） */
    delete(scheduleId: string, userId: string): Promise<void>
}
