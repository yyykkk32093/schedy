/**
 * WaitlistAuditLog: キャンセル待ち履歴の監査ログエンティティ。
 * - 物理削除に伴う履歴保持
 * - action: JOINED | CANCELLED | PROMOTED
 */
export class WaitlistAuditLog {
    readonly id: string | undefined
    readonly scheduleId: string
    readonly userId: string
    readonly action: string
    readonly createdAt: Date

    constructor(params: {
        id?: string
        scheduleId: string
        userId: string
        action: string
        createdAt?: Date
    }) {
        this.id = params.id
        this.scheduleId = params.scheduleId
        this.userId = params.userId
        this.action = params.action
        this.createdAt = params.createdAt ?? new Date()
    }
}
