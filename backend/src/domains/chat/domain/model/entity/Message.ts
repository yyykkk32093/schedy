import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ChannelId } from '../valueObject/ChannelId.js'
import { MessageContent } from '../valueObject/MessageContent.js'
import { MessageId } from '../valueObject/MessageId.js'

interface MessageProps {
    id: MessageId
    channelId: ChannelId
    senderId: UserId
    parentMessageId: MessageId | null
    content: MessageContent
    mentions: string[]
    isPinned: boolean
    deletedBy: string | null
    createdAt: Date
    updatedAt: Date
}

interface CreateMessageParams {
    id: MessageId
    channelId: ChannelId
    senderId: UserId
    content: MessageContent
    parentMessageId?: MessageId | null
    mentions?: string[]
}

interface ReconstructMessageParams {
    id: string
    channelId: string
    senderId: string
    parentMessageId: string | null
    content: string
    mentions: string[]
    isPinned: boolean
    deletedBy: string | null
    createdAt: Date
    updatedAt: Date
}

export class Message extends AggregateRoot {
    private constructor(private readonly props: MessageProps) {
        super()
    }

    static create(params: CreateMessageParams): Message {
        return new Message({
            id: params.id,
            channelId: params.channelId,
            senderId: params.senderId,
            parentMessageId: params.parentMessageId ?? null,
            content: params.content,
            mentions: params.mentions ?? [],
            isPinned: false,
            deletedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }

    static reconstruct(params: ReconstructMessageParams): Message {
        return new Message({
            id: new MessageId(params.id),
            channelId: new ChannelId(params.channelId),
            senderId: UserId.create(params.senderId),
            parentMessageId: params.parentMessageId ? new MessageId(params.parentMessageId) : null,
            content: new MessageContent(params.content),
            mentions: params.mentions,
            isPinned: params.isPinned,
            deletedBy: params.deletedBy,
            createdAt: params.createdAt,
            updatedAt: params.updatedAt,
        })
    }

    // ── Getters ──

    getId(): MessageId { return this.props.id }
    getChannelId(): ChannelId { return this.props.channelId }
    getSenderId(): UserId { return this.props.senderId }
    getParentMessageId(): MessageId | null { return this.props.parentMessageId }
    getContent(): MessageContent { return this.props.content }
    getMentions(): string[] { return this.props.mentions }
    isPinned(): boolean { return this.props.isPinned }
    getDeletedBy(): string | null { return this.props.deletedBy }
    getCreatedAt(): Date { return this.props.createdAt }
    getUpdatedAt(): Date { return this.props.updatedAt }

    // ── Domain Logic ──

    isDeleted(): boolean {
        return this.props.deletedBy !== null
    }

    isReply(): boolean {
        return this.props.parentMessageId !== null
    }

    /** 論理削除（送信者本人のみ） */
    markAsDeleted(deletedByUserId: string): void {
        if (this.props.senderId.getValue() !== deletedByUserId) {
            throw new Error('送信者本人のみ削除できます')
        }
        if (this.props.deletedBy) {
            return // 既に削除済み
        }
        this.props.deletedBy = deletedByUserId
    }
}
