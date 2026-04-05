import type { Prisma, PrismaClient } from '@prisma/client';
import type { IMessageReactionRepository } from '../../domain/repository/IMessageReactionRepository.js';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class MessageReactionRepositoryImpl implements IMessageReactionRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async addStampReaction(params: { messageId: string; userId: string; stampId: string }): Promise<void> {
        await this.prisma.messageReaction.upsert({
            where: { messageId_userId_stampId: { messageId: params.messageId, userId: params.userId, stampId: params.stampId } },
            create: { messageId: params.messageId, userId: params.userId, stampId: params.stampId },
            update: {},
        })
    }

    async addEmojiReaction(params: { messageId: string; userId: string; emoji: string }): Promise<void> {
        await this.prisma.messageReaction.upsert({
            where: { messageId_userId_emoji: { messageId: params.messageId, userId: params.userId, emoji: params.emoji } },
            create: { messageId: params.messageId, userId: params.userId, emoji: params.emoji },
            update: {},
        })
    }

    async removeStampReaction(params: { messageId: string; userId: string; stampId: string }): Promise<void> {
        await this.prisma.messageReaction.deleteMany({
            where: { messageId: params.messageId, userId: params.userId, stampId: params.stampId },
        })
    }

    async removeEmojiReaction(params: { messageId: string; userId: string; emoji: string }): Promise<void> {
        await this.prisma.messageReaction.deleteMany({
            where: { messageId: params.messageId, userId: params.userId, emoji: params.emoji },
        })
    }
}
