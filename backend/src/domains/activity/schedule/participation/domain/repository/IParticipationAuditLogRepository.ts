import type { ParticipationAuditLog } from '../model/entity/ParticipationAuditLog.js'

export interface IParticipationAuditLogRepository {
    save(log: ParticipationAuditLog): Promise<void>

    /**
     * 指定スケジュール・ユーザーの直近キャンセル履歴を取得
     * - action = CANCELLED で createdAt 降順の最新1件を返す
     * - 該当なしの場合は null
     */
    findLatestCancellation(scheduleId: string, userId: string): Promise<ParticipationAuditLog | null>
}
