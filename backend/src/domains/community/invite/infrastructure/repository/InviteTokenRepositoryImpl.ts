import type { Prisma, PrismaClient } from '@prisma/client'
import type { IInviteTokenRepository } from '../../domain/repository/IInviteTokenRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class InviteTokenRepositoryImpl implements IInviteTokenRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async save(token: {
        id: string
        communityId: string
        token: string
        createdBy: string
        expiresAt: Date
        maxUses?: number | null
    }): Promise<void> {
        await this.prisma.inviteToken.create({
            data: {
                id: token.id,
                communityId: token.communityId,
                token: token.token,
                createdBy: token.createdBy,
                expiresAt: token.expiresAt,
                maxUses: token.maxUses ?? null,
            },
        })
    }

    async findByToken(token: string) {
        return this.prisma.inviteToken.findUnique({ where: { token } })
    }

    async recordUsage(tokenId: string, userId: string): Promise<void> {
        await this.prisma.inviteToken.update({
            where: { id: tokenId },
            data: { currentUses: { increment: 1 } },
        })
        await this.prisma.inviteTokenUsage.create({
            data: { tokenId, userId },
        })
    }

    async findByCommunityId(communityId: string) {
        return this.prisma.inviteToken.findMany({
            where: { communityId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })
    }
}
