import type { Participation } from '../model/entity/Participation.js'

export interface IParticipationRepository {
    findById(id: string): Promise<Participation | null>
    findByScheduleAndUser(scheduleId: string, userId: string): Promise<Participation | null>
    findsByScheduleId(scheduleId: string): Promise<Participation[]>
    count(scheduleId: string): Promise<number>
    /** 複数スケジュールの参加者数を一括取得（GROUP BY scheduleId） */
    countByScheduleIds(scheduleIds: string[]): Promise<Map<string, number>>
    add(participation: Participation): Promise<void>
    update(participation: Participation): Promise<void>
    delete(scheduleId: string, userId: string): Promise<void>
    deleteById(id: string): Promise<void>
    /** W3-13b: コミュニティ内で過去使われたビジター名を重複なしで取得 */
    findDistinctVisitorNamesByCommunityId(communityId: string): Promise<string[]>
}
