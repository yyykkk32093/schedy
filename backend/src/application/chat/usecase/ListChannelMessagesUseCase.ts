import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'
import type { IMessageRepository, MessageListItemDto } from '@/domains/chat/domain/repository/IMessageRepository.js'
import { aggregateReactions, type ReactionSummary } from '@/domains/chat/domain/service/aggregateReactions.js'

interface ListChannelMessagesInput {
    channelId: string
    currentUserId: string
    cursor?: string
    limit?: number
}

interface ListChannelMessagesOutput {
    messages: MessageResponseItem[]
    nextCursor: string | null
}

export interface MessageResponseItem {
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
    attachments: Array<{ id: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number }>
    reactions: ReactionSummary[]
    replyCount: number
    latestReply: { senderDisplayName: string | null; content: string; createdAt: string } | null
    createdAt: string
    updatedAt: string
}

/**
 * チャンネルのメッセージ一覧取得（トップレベルのみ、カーソルページネーション）
 */
export class ListChannelMessagesUseCase {
    constructor(
        private readonly channelRepository: IChatChannelRepository,
        private readonly messageRepository: IMessageRepository,
    ) { }

    async execute(input: ListChannelMessagesInput): Promise<ListChannelMessagesOutput> {
        const limit = Math.min(input.limit ?? 50, 100)

        const items = await this.messageRepository.listByChannel({
            channelId: input.channelId,
            currentUserId: input.currentUserId,
            cursor: input.cursor,
            limit: limit + 1,
        })

        const hasMore = items.length > limit
        const page = hasMore ? items.slice(0, limit) : items
        const nextCursor = hasMore ? page[page.length - 1].id : null

        return {
            messages: page.map((m) => this.toResponse(m, input.currentUserId)),
            nextCursor,
        }
    }

    private toResponse(m: MessageListItemDto, currentUserId: string): MessageResponseItem {
        return {
            id: m.id,
            channelId: m.channelId,
            senderId: m.senderId,
            senderDisplayName: m.senderDisplayName,
            senderAvatarUrl: m.senderAvatarUrl,
            parentMessageId: m.parentMessageId,
            content: m.content,
            mentions: m.mentions,
            isPinned: m.isPinned,
            deletedBy: m.deletedBy,
            attachments: m.attachments,
            reactions: aggregateReactions(m.reactions, currentUserId),
            replyCount: m.replyCount,
            latestReply: m.latestReply
                ? {
                    senderDisplayName: m.latestReply.senderDisplayName,
                    content: m.latestReply.content,
                    createdAt: m.latestReply.createdAt.toISOString(),
                }
                : null,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        }
    }
}
