import type { IMessageReactionRepository } from '@/domains/chat/domain/repository/IMessageReactionRepository.js'
import type { IMessageRepository } from '@/domains/chat/domain/repository/IMessageRepository.js'

interface AddReactionInput {
    messageId: string
    userId: string
    stampId?: string
    emoji?: string
}

interface AddReactionOutput {
    channelId: string
}

/**
 * リアクション追加 UseCase
 */
export class AddReactionUseCase {
    constructor(
        private readonly messageRepository: IMessageRepository,
        private readonly reactionRepository: IMessageReactionRepository,
    ) { }

    async execute(input: AddReactionInput): Promise<AddReactionOutput> {
        if (!input.stampId && !input.emoji) {
            throw Object.assign(new Error('stampId または emoji が必要です'), { code: 'INVALID_INPUT', statusCode: 400 })
        }

        const message = await this.messageRepository.findById(input.messageId)
        if (!message) {
            throw Object.assign(new Error('メッセージが見つかりません'), { code: 'NOT_FOUND', statusCode: 404 })
        }

        if (input.stampId) {
            await this.reactionRepository.addStampReaction({
                messageId: input.messageId,
                userId: input.userId,
                stampId: input.stampId,
            })
        } else if (input.emoji) {
            await this.reactionRepository.addEmojiReaction({
                messageId: input.messageId,
                userId: input.userId,
                emoji: input.emoji,
            })
        }

        return { channelId: message.channelId }
    }
}
