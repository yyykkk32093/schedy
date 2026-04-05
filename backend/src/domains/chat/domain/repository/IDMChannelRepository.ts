/**
 * IDMChannelRepository — DM チャンネル永続化インターフェース
 *
 * DM チャンネル + DMParticipant を凝集して管理する。
 */

export interface IDMChannelRepository {
    /**
     * 同一参加者セットの既存DM チャンネルを検索（2人DMのみ対象）
     * 全DMフルスキャンではなく、参加者ベースの効率的なクエリで実装する
     */
    findByParticipants(participantIds: string[]): Promise<DMChannelDTO | null>

    /** DM チャンネルを新規作成（参加者も同時に INSERT） */
    create(participantIds: string[]): Promise<DMChannelDTO>

    /** ユーザーが参加する DM チャンネル一覧（最新メッセージ付き） */
    listByUserId(userId: string): Promise<DMChannelListItem[]>

    /** DM チャンネルから参加者を物理削除 */
    removeParticipant(channelId: string, userId: string): Promise<void>
}

export interface DMChannelDTO {
    channelId: string
    participants: string[]
}

export interface DMChannelListItem {
    channelId: string
    participants: string[]
    lastMessage: {
        id: string
        senderId: string
        content: string
        createdAt: Date
    } | null
}
