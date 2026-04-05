import type { Prisma, PrismaClient } from '@prisma/client'
import type {
    IMessageRepository,
    ListByChannelParams,
    ListRepliesParams,
    MessageListItemDto,
    MessageRow,
    SaveMessageParams,
    SearchByChannelParams,
} from '../../domain/repository/IMessageRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

/** メッセージ一覧取得時の共通 include */
const messageListInclude = {
    sender: { select: { displayName: true, avatarUrl: true } },
    attachments: true,
    reactions: { include: { stamp: true } },
    _count: { select: { replies: true } },
    replies: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: {
            content: true,
            createdAt: true,
            sender: { select: { displayName: true } },
        },
    },
}

/** スレッド返信取得時の include（latestReply / replyCount 不要） */
const replyListInclude = {
    sender: { select: { displayName: true, avatarUrl: true } },
    attachments: true,
    reactions: { include: { stamp: true } },
}

export class MessageRepositoryImpl implements IMessageRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(messageId: string): Promise<MessageRow | null> {
        const row = await this.prisma.message.findUnique({ where: { id: messageId } })
        if (!row) return null
        return {
            id: row.id,
            channelId: row.channelId,
            senderId: row.senderId,
            parentMessageId: row.parentMessageId,
            content: row.content,
            mentions: row.mentions,
            isPinned: row.isPinned,
            deletedBy: row.deletedBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    async save(params: SaveMessageParams): Promise<MessageRow> {
        const row = await this.prisma.message.create({
            data: {
                channelId: params.channelId,
                senderId: params.senderId,
                content: params.content,
                parentMessageId: params.parentMessageId,
                mentions: params.mentions,
            },
        })
        return {
            id: row.id,
            channelId: row.channelId,
            senderId: row.senderId,
            parentMessageId: row.parentMessageId,
            content: row.content,
            mentions: row.mentions,
            isPinned: row.isPinned,
            deletedBy: row.deletedBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    async softDelete(messageId: string, deletedBy: string): Promise<void> {
        await this.prisma.message.update({
            where: { id: messageId },
            data: { deletedBy },
        })
    }

    async listByChannel(params: ListByChannelParams): Promise<MessageListItemDto[]> {
        const { channelId, currentUserId, cursor, limit } = params

        const messages = await this.prisma.message.findMany({
            where: { channelId, parentMessageId: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: messageListInclude,
        })

        return messages.map((m) => this.toListItemDto(m, currentUserId))
    }

    async searchByChannel(params: SearchByChannelParams): Promise<MessageListItemDto[]> {
        const { channelId, currentUserId, query, cursor, limit } = params

        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                content: { contains: query, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: messageListInclude,
        })

        return messages.map((m) => this.toListItemDto(m, currentUserId))
    }

    async listReplies(params: ListRepliesParams): Promise<MessageListItemDto[]> {
        const { parentMessageId, currentUserId, cursor, limit } = params

        const replies = await this.prisma.message.findMany({
            where: { parentMessageId },
            orderBy: { createdAt: 'asc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: replyListInclude,
        })

        return replies.map((m) => this.toReplyDto(m, currentUserId))
    }

    async countReplies(parentMessageId: string): Promise<number> {
        return this.prisma.message.count({ where: { parentMessageId } })
    }

    // ── Private mapping ──

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private toListItemDto(m: any, _currentUserId: string): MessageListItemDto {
        const latestReplyRaw = m.replies?.[0] ?? null

        return {
            id: m.id,
            channelId: m.channelId,
            senderId: m.senderId,
            senderDisplayName: m.sender?.displayName ?? null,
            senderAvatarUrl: m.sender?.avatarUrl ?? null,
            parentMessageId: m.parentMessageId,
            content: m.content,
            mentions: m.mentions,
            isPinned: m.isPinned,
            deletedBy: m.deletedBy,
            attachments: (m.attachments ?? []).map((a: any) => ({
                id: a.id,
                fileUrl: a.fileUrl,
                fileName: a.fileName,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
            })),
            reactions: (m.reactions ?? []).map((r: any) => ({
                id: r.id,
                userId: r.userId,
                stampId: r.stampId,
                emoji: r.emoji,
                stamp: r.stamp ? { id: r.stamp.id, name: r.stamp.name, imageUrl: r.stamp.imageUrl } : null,
                createdAt: r.createdAt,
            })),
            replyCount: m._count?.replies ?? 0,
            latestReply: latestReplyRaw
                ? {
                    senderDisplayName: latestReplyRaw.sender?.displayName ?? null,
                    content: latestReplyRaw.content,
                    createdAt: latestReplyRaw.createdAt,
                }
                : null,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private toReplyDto(m: any, _currentUserId: string): MessageListItemDto {
        return {
            id: m.id,
            channelId: m.channelId,
            senderId: m.senderId,
            senderDisplayName: m.sender?.displayName ?? null,
            senderAvatarUrl: m.sender?.avatarUrl ?? null,
            parentMessageId: m.parentMessageId,
            content: m.content,
            mentions: m.mentions,
            isPinned: m.isPinned,
            deletedBy: m.deletedBy,
            attachments: (m.attachments ?? []).map((a: any) => ({
                id: a.id,
                fileUrl: a.fileUrl,
                fileName: a.fileName,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
            })),
            reactions: (m.reactions ?? []).map((r: any) => ({
                id: r.id,
                userId: r.userId,
                stampId: r.stampId,
                emoji: r.emoji,
                stamp: r.stamp ? { id: r.stamp.id, name: r.stamp.name, imageUrl: r.stamp.imageUrl } : null,
                createdAt: r.createdAt,
            })),
            replyCount: 0,
            latestReply: null,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
        }
    }
}
