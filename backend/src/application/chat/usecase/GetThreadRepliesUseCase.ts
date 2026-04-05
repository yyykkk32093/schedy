import type { IMessageRepository } from '@/domains/chat/domain/repository/IMessageRepository.js'
import { aggregateReactions } from '@/domains/chat/domain/service/aggregateReactions.js'
import type { MessageResponseItem } from './ListChannelMessagesUseCase.js'

interface GetThreadRepliesInput {
    parentMessageId: string
    currentUserId: string
    cursor?: string
    limit?: number
}

interface GetThreadRepliesOutput {
    messages: MessageResponseItem[]
    nextCursor: string | null
}

/**
 * スレッド返信一覧取得（時系列昇順、カーソルページネーション）
 */
export class GetThreadRepliesUseCase {
    constructor(
        private readonly messageRepository: IMessageRepository,
    ) { }

    async execute(input: GetThreadRepliesInput): Promise<GetThreadRepliesOutput> {
        const limit = Math.min(input.limit ?? 50, 100)

        const items = await this.messageRepository.listReplies({
            parentMessageId: input.parentMessageId,
            currentUserId: input.currentUserId,
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
                replyCount: 0,
                latestReply: null,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
            nextCursor,
        }
    }
}
