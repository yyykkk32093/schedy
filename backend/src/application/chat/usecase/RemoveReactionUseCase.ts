import type { IMessageReactionRepository } from '@/domains/chat/domain/repository/IMessageReactionRepository.js'
import type { IMessageRepository } from '@/domains/chat/domain/repository/IMessageRepository.js'

interface RemoveReactionInput {
    messageId: string
    userId: string
    stampId?: string
    emoji?: string
}

interface RemoveReactionOutput {
    channelId: string
}

/**
 * リアクション削除 UseCase
 */
export class RemoveReactionUseCase {
    constructor(
        private readonly messageRepository: IMessageRepository,
        private readonly reactionRepository: IMessageReactionRepository,
    ) { }

    async execute(input: RemoveReactionInput): Promise<RemoveReactionOutput> {
        const message = await this.messageRepository.findById(input.messageId)
        if (!message) {
            throw Object.assign(new Error('メッセージが見つかりません'), { code: 'NOT_FOUND', statusCode: 404 })
        }

        if (input.stampId) {
            await this.reactionRepository.removeStampReaction({
                messageId: input.messageId,
                userId: input.userId,
                stampId: input.stampId,
            })
        } else if (input.emoji) {
            await this.reactionRepository.removeEmojiReaction({
                messageId: input.messageId,
                userId: input.userId,
                emoji: input.emoji,
            })
        }

        return { channelId: message.channelId }
    }
}
