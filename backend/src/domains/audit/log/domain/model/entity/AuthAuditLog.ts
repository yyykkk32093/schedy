/**
 * AuthAuditLog: 認証関連の監査ログエンティティ。
 * - TX内で直接INSERTされる（Outbox不要）
 * - action: auth.login.success | auth.login.failed | user.registered
 */
export class AuthAuditLog {
    readonly id: string | undefined
    readonly action: string
    readonly userId: string
    readonly authMethod: string
    readonly detail: string | null
    readonly occurredAt: Date
    readonly createdAt: Date

    constructor(params: {
        id?: string
        action: string
        userId: string
        authMethod: string
        detail?: string | null
        occurredAt?: Date
        createdAt?: Date
    }) {
        this.id = params.id
        this.action = params.action
        this.userId = params.userId
        this.authMethod = params.authMethod
        this.detail = params.detail ?? null
        this.occurredAt = params.occurredAt ?? new Date()
        this.createdAt = params.createdAt ?? new Date()
    }
}
