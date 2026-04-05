export interface IInviteTokenRepository {
    save(token: {
        id: string
        communityId: string
        token: string
        createdBy: string
        expiresAt: Date
        maxUses?: number | null
    }): Promise<void>

    findByToken(token: string): Promise<{
        id: string
        communityId: string
        token: string
        createdBy: string
        expiresAt: Date
        maxUses: number | null
        currentUses: number
        createdAt: Date
    } | null>

    /** 使用回数をインクリメントし、InviteTokenUsage レコードを作成 */
    recordUsage(tokenId: string, userId: string): Promise<void>

    findByCommunityId(communityId: string): Promise<Array<{
        id: string
        token: string
        createdBy: string
        expiresAt: Date
        maxUses: number | null
        currentUses: number
        createdAt: Date
    }>>
}
