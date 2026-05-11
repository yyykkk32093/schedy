import type { Schedule } from '../model/entity/Schedule.js'

export interface IScheduleRepository {
    findById(id: string): Promise<Schedule | null>
    findsByActivityId(activityId: string): Promise<Schedule[]>
    findUpcomingByActivityIds(activityIds: string[]): Promise<Map<string, Schedule[]>>
    /** コミュニティ配下の将来スケジュールを取得（メンバー退出時の連鎖キャンセル用） */
    findFutureByCommunityId(communityId: string): Promise<Schedule[]>
    save(schedule: Schedule): Promise<void>
    /** 複数スケジュールを一括作成（createMany） */
    saveMany(schedules: Schedule[]): Promise<void>
    /** 複数スケジュールを一括削除（参加者ゼロの場合のみ使用） */
    deleteMany(ids: string[]): Promise<void>
    /** Phase 2 [202603_08]: featureGateMiddleware 用 — 紐づくコミュニティの grade を取得。 */
    findCommunityGrade(scheduleId: string): Promise<{ grade: string } | null>
}
