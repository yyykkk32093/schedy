import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'
import type { IMessageRepository, MessageRow } from '@/domains/chat/domain/repository/IMessageRepository.js'

interface SendMessageInput {
    channelId: string
    senderId: string
    senderDisplayName: string | null
    senderAvatarUrl: string | null
    content: string
    parentMessageId?: string | null
    mentions?: string[]
}

/** トップレベルメッセージ送信時のレスポンス */
interface SendMessageOutput {
    type: 'message'
    message: MessageRow
    senderDisplayName: string | null
    senderAvatarUrl: string | null
}

/** スレッド返信送信時のレスポンス */
interface SendThreadReplyOutput {
    type: 'thread_reply'
    message: MessageRow
    senderDisplayName: string | null
    senderAvatarUrl: string | null
    parentMessageId: string
    replyCount: number
}

export type SendMessageResult = SendMessageOutput | SendThreadReplyOutput

/**
 * メッセージ送信 UseCase（REST / WebSocket 共通）
 *
 * - D-2: parentMessageId の指すメッセージが既に返信の場合は 400 エラー
 * - スレッド返信時は replyCount を取得して返却
 */
export class SendMessageUseCase {
    constructor(
        private readonly channelRepository: IChatChannelRepository,
        private readonly messageRepository: IMessageRepository,
    ) { }

    async execute(input: SendMessageInput): Promise<SendMessageResult> {
        // バリデーション: content（空文字は画像のみ送信で許可）
        const content = input.content?.trim() ?? ''
        if (content.length > 500) {
            throw Object.assign(new Error('メッセージは500文字以内で入力してください'), { code: 'CONTENT_TOO_LONG', statusCode: 400 })
        }

        // チャンネル存在確認
        const channel = await this.channelRepository.findById(input.channelId)
        if (!channel) {
            throw Object.assign(new Error('チャンネルが見つかりません'), { code: 'CHANNEL_NOT_FOUND', statusCode: 404 })
        }

        // D-2: ネスト制限バリデーション
        let resolvedParentId: string | null = null
        if (input.parentMessageId) {
            const parent = await this.messageRepository.findById(input.parentMessageId)
            if (!parent) {
                throw Object.assign(new Error('親メッセージが見つかりません'), { code: 'PARENT_NOT_FOUND', statusCode: 404 })
            }
            if (parent.parentMessageId) {
                throw Object.assign(
                    new Error('返信への返信は許可されていません。スレッドは1階層のみです。'),
                    { code: 'NESTED_REPLY_NOT_ALLOWED', statusCode: 400 },
                )
            }
            resolvedParentId = parent.id
        }

        // メッセージ保存
        const message = await this.messageRepository.save({
            channelId: input.channelId,
            senderId: input.senderId,
            content,
            parentMessageId: resolvedParentId,
            mentions: input.mentions ?? [],
        })

        // スレッド返信の場合
        if (resolvedParentId) {
            const replyCount = await this.messageRepository.countReplies(resolvedParentId)
            return {
                type: 'thread_reply',
                message,
                senderDisplayName: input.senderDisplayName,
                senderAvatarUrl: input.senderAvatarUrl,
                parentMessageId: resolvedParentId,
                replyCount,
            }
        }

        // トップレベルメッセージ
        return {
            type: 'message',
            message,
            senderDisplayName: input.senderDisplayName,
            senderAvatarUrl: input.senderAvatarUrl,
        }
    }
}
