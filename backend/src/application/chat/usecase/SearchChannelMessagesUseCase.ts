import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'
import type { IMessageRepository } from '@/domains/chat/domain/repository/IMessageRepository.js'
import { aggregateReactions } from '@/domains/chat/domain/service/aggregateReactions.js'
import type { MessageResponseItem } from './ListChannelMessagesUseCase.js'

interface SearchChannelMessagesInput {
    channelId: string
    currentUserId: string
    query: string
    cursor?: string
    limit?: number
}

interface SearchChannelMessagesOutput {
    messages: MessageResponseItem[]
    nextCursor: string | null
    query: string
}

/**
 * チャンネルのメッセージ検索（ILIKE部分一致）
 */
export class SearchChannelMessagesUseCase {
    constructor(
        private readonly channelRepository: IChatChannelRepository,
        private readonly messageRepository: IMessageRepository,
    ) { }

    async execute(input: SearchChannelMessagesInput): Promise<SearchChannelMessagesOutput> {
        if (!input.query || input.query.trim().length < 2) {
            throw Object.assign(
                new Error('検索キーワードは2文字以上必要です'),
                { code: 'INVALID_QUERY', statusCode: 400 },
            )
        }

        const channel = await this.channelRepository.findById(input.channelId)
        if (!channel) {
            throw Object.assign(
                new Error('チャンネルが見つかりません'),
                { code: 'CHANNEL_NOT_FOUND', statusCode: 404 },
            )
        }

        const limit = Math.min(input.limit ?? 30, 100)

        const items = await this.messageRepository.searchByChannel({
            channelId: input.channelId,
            currentUserId: input.currentUserId,
            query: input.query.trim(),
            cursor: input.cursor,
            limit: limit + 1,
        })

        const hasMore = items.length > limit
        const page = hasMore ? items.slice(0, limit) : items
        const nextCursor = hasMore ? page[page.length - 1].id : null

        return {
            messages: page.map((m) => ({
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
                reactions: aggregateReactions(m.reactions, input.currentUserId),
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
            })),
            nextCursor,
            query: input.query.trim(),
        }
    }
}
