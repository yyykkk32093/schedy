export interface IInviteTokenRepository {
    save(token: {
        id: string
        communityId: string
        token: string
        createdBy: string
        expiresAt: Date
    }): Promise<void>

    findByToken(token: string): Promise<{
        id: string
        communityId: string
        token: string
        createdBy: string
        expiresAt: Date
        usedAt: Date | null
        usedBy: string | null
        createdAt: Date
    } | null>

    markUsed(token: string, usedBy: string): Promise<void>

    findByCommunityId(communityId: string): Promise<Array<{
        id: string
        token: string
        createdBy: string
        expiresAt: Date
        usedAt: Date | null
        usedBy: string | null
        createdAt: Date
    }>>
}
