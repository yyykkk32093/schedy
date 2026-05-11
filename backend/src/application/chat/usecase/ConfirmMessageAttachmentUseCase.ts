import type { IFileStorageService } from '@/_sharedTech/storage/IFileStorageService.js'
import type { IMessageRepository, MessageAttachmentDto } from '@/domains/chat/domain/repository/IMessageRepository.js'

export class MessageNotFoundError extends Error {
    readonly code = 'NOT_FOUND'
    constructor() {
        super('メッセージが見つかりません')
        this.name = 'MessageNotFoundError'
    }
}

export class AttachmentNotOwnerError extends Error {
    readonly code = 'FORBIDDEN'
    constructor() {
        super('自分のメッセージにのみ添付できます')
        this.name = 'AttachmentNotOwnerError'
    }
}

export class AttachmentObjectMissingError extends Error {
    readonly code = 'NOT_FOUND'
    constructor() {
        super('アップロードされたファイルが見つかりません')
        this.name = 'AttachmentObjectMissingError'
    }
}

export interface ConfirmMessageAttachmentInput {
    userId: string
    channelId: string
    messageId: string
    key: string
    fileName: string | null
    mimeType: string | null
    fileSize: number | null
}

export class ConfirmMessageAttachmentUseCase {
    constructor(
        private readonly messageRepository: IMessageRepository,
        private readonly storageService: IFileStorageService,
    ) { }

    async execute(input: ConfirmMessageAttachmentInput): Promise<MessageAttachmentDto> {
        const message = await this.messageRepository.findById(input.messageId)
        if (!message || message.channelId !== input.channelId) {
            throw new MessageNotFoundError()
        }
        if (message.senderId !== input.userId) {
            throw new AttachmentNotOwnerError()
        }

        const exists = await this.storageService.objectExists(input.key)
        if (!exists) {
            throw new AttachmentObjectMissingError()
        }

        const fileUrl = this.storageService.getPublicUrl(input.key)

        return this.messageRepository.saveAttachment({
            messageId: input.messageId,
            fileUrl,
            fileName: input.fileName ?? 'unknown',
            mimeType: input.mimeType ?? 'application/octet-stream',
            fileSize: input.fileSize ?? 0,
        })
    }
}
