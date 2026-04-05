/**
 * IChatChannelRepository — チャットチャンネルの永続化インターフェース
 */
export interface IChatChannelRepository {
    /** communityId でチャンネルを検索 */
    findByCommunityId(communityId: string): Promise<ChatChannelRow | null>

    /** activityId でチャンネルを検索 */
    findByActivityId(activityId: string): Promise<ChatChannelRow | null>

    /** ID でチャンネルを検索 */
    findById(channelId: string): Promise<ChatChannelRow | null>

    /** コミュニティチャンネルを作成 */
    createCommunityChannel(communityId: string): Promise<ChatChannelRow>

    /** アクティビティチャンネルを作成 */
    createActivityChannel(activityId: string): Promise<ChatChannelRow>
}

/** リポジトリが返すチャンネル行（ドメインエンティティを持たないため DTO 的） */
export interface ChatChannelRow {
    id: string
    type: string
    communityId: string | null
    activityId: string | null
}
