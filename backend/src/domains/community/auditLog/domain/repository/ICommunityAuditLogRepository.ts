export interface ICommunityAuditLogRepository {
    save(log: {
        communityId: string
        actorUserId: string
        action: string
        field?: string | null
        before?: string | null
        after?: string | null
        summary: string
    }): Promise<void>

    findByCommunityId(communityId: string, limit?: number): Promise<Array<{
        id: string
        communityId: string
        actorUserId: string
        action: string
        field: string | null
        before: string | null
        after: string | null
        summary: string
        createdAt: Date
    }>>
}
