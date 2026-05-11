/**
 * IMessageRepository — メッセージの永続化インターフェース
 *
 * 一覧取得はフロントのレスポンス形式に依存するため、
 * DTO（MessageListItemDto）で返却する。ドメインエンティティ変換は UseCase が行う。
 */

export interface IMessageRepository {
    /** メッセージを ID で取得 */
    findById(messageId: string): Promise<MessageRow | null>

    /** メッセージを保存 */
    save(params: SaveMessageParams): Promise<MessageRow>

    /** メッセージを論理削除 */
    softDelete(messageId: string, deletedBy: string): Promise<void>

    /** トップレベルメッセージ一覧（カーソルページネーション） */
    listByChannel(params: ListByChannelParams): Promise<MessageListItemDto[]>

    /** メッセージ検索（ILIKE部分一致） */
    searchByChannel(params: SearchByChannelParams): Promise<MessageListItemDto[]>

    /** スレッド返信一覧（カーソルページネーション、昇順） */
    listReplies(params: ListRepliesParams): Promise<MessageListItemDto[]>

    /** スレッド返信数を取得 */
    countReplies(parentMessageId: string): Promise<number>

    /** メッセージ添付ファイルを保存 */
    saveAttachment(params: SaveAttachmentParams): Promise<MessageAttachmentDto>
}

// ── Params ──

export interface SaveMessageParams {
    channelId: string
    senderId: string
    content: string
    parentMessageId: string | null
    mentions: string[]
}

export interface ListByChannelParams {
    channelId: string
    currentUserId: string
    cursor?: string
    limit: number
}

export interface SearchByChannelParams {
    channelId: string
    currentUserId: string
    query: string
    cursor?: string
    limit: number
}

export interface ListRepliesParams {
    parentMessageId: string
    currentUserId: string
    cursor?: string
    limit: number
}

// ── DTOs ──

export interface MessageRow {
    id: string
    channelId: string
    senderId: string
    parentMessageId: string | null
    content: string
    mentions: unknown
    isPinned: boolean
    deletedBy: string | null
    createdAt: Date
    updatedAt: Date
}

export interface MessageListItemDto {
    id: string
    channelId: string
    senderId: string
    senderDisplayName: string | null
    senderAvatarUrl: string | null
    parentMessageId: string | null
    content: string
    mentions: unknown
    isPinned: boolean
    deletedBy: string | null
    attachments: MessageAttachmentDto[]
    reactions: RawReactionDto[]
    replyCount: number
    latestReply: LatestReplyDto | null
    createdAt: Date
    updatedAt: Date
}

export interface MessageAttachmentDto {
    id: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
}

export interface SaveAttachmentParams {
    messageId: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
}

export interface RawReactionDto {
    id: string
    userId: string
    stampId: string | null
    emoji: string | null
    stamp: { id: string; name: string; imageUrl: string } | null
    createdAt: Date
}

export interface LatestReplyDto {
    senderDisplayName: string | null
    content: string
    createdAt: Date
}
