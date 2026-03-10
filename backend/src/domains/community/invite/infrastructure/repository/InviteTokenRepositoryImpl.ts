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
    }): Promise<void> {
        await this.prisma.inviteToken.create({
            data: {
                id: token.id,
                communityId: token.communityId,
                token: token.token,
                createdBy: token.createdBy,
                expiresAt: token.expiresAt,
            },
        })
    }

    async findByToken(token: string) {
        return this.prisma.inviteToken.findUnique({ where: { token } })
    }

    async markUsed(token: string, usedBy: string): Promise<void> {
        await this.prisma.inviteToken.update({
            where: { token },
            data: { usedAt: new Date(), usedBy },
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
