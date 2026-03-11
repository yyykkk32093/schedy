/**
 * CommunityAuditLog: コミュニティ設定変更の監査ログエンティティ。
 * - TX内で直接INSERTされる
 */
export class CommunityAuditLog {
    readonly id: string | undefined
    readonly communityId: string
    readonly actorUserId: string
    readonly action: string
    readonly field: string | null
    readonly before: string | null
    readonly after: string | null
    readonly summary: string
    readonly createdAt: Date

    constructor(params: {
        id?: string
        communityId: string
        actorUserId: string
        action: string
        field?: string | null
        before?: string | null
        after?: string | null
        summary: string
        createdAt?: Date
    }) {
        this.id = params.id
        this.communityId = params.communityId
        this.actorUserId = params.actorUserId
        this.action = params.action
        this.field = params.field ?? null
        this.before = params.before ?? null
        this.after = params.after ?? null
        this.summary = params.summary
        this.createdAt = params.createdAt ?? new Date()
    }
}
