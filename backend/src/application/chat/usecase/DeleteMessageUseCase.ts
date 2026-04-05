import type { IMessageRepository } from '@/domains/chat/domain/repository/IMessageRepository.js';

interface DeleteMessageInput {
    messageId: string
    userId: string
}

/**
 * メッセージ論理削除（送信者本人のみ）
 */
export class DeleteMessageUseCase {
    constructor(
        private readonly messageRepository: IMessageRepository,
    ) { }

    async execute(input: DeleteMessageInput): Promise<{ channelId: string; alreadyDeleted: boolean }> {
        const message = await this.messageRepository.findById(input.messageId)
        if (!message) {
            throw Object.assign(new Error('メッセージが見つかりません'), { code: 'NOT_FOUND', statusCode: 404 })
        }
        if (message.senderId !== input.userId) {
            throw Object.assign(new Error('送信者本人のみ削除できます'), { code: 'FORBIDDEN', statusCode: 403 })
        }
        if (message.deletedBy) {
            return { channelId: message.channelId, alreadyDeleted: true }
        }

        await this.messageRepository.softDelete(input.messageId, input.userId)
        return { channelId: message.channelId, alreadyDeleted: false }
    }
}
