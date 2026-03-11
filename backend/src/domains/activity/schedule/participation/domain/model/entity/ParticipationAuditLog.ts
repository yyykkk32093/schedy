/**
 * ParticipationAuditLog: 参加履歴の監査ログエンティティ。
 * - 物理削除に伴う履歴保持（統計クエリ用）
 * - action: JOINED | CANCELLED | REMOVED_BY_ADMIN
 */
export class ParticipationAuditLog {
    readonly id: string | undefined
    readonly scheduleId: string
    readonly userId: string
    readonly action: string
    readonly cancelledAt: Date | null
    readonly paymentMethod: string | null
    readonly paymentStatus: string | null
    readonly createdAt: Date

    constructor(params: {
        id?: string
        scheduleId: string
        userId: string
        action: string
        cancelledAt?: Date | null
        paymentMethod?: string | null
        paymentStatus?: string | null
        createdAt?: Date
    }) {
        this.id = params.id
        this.scheduleId = params.scheduleId
        this.userId = params.userId
        this.action = params.action
        this.cancelledAt = params.cancelledAt ?? null
        this.paymentMethod = params.paymentMethod ?? null
        this.paymentStatus = params.paymentStatus ?? null
        this.createdAt = params.createdAt ?? new Date()
    }
}
