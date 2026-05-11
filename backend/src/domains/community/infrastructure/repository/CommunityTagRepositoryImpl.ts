import type { Prisma, PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { ICommunityTagRepository } from '../../domain/repository/ICommunityTagRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class CommunityTagRepositoryImpl implements ICommunityTagRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async findByCommunityId(communityId: string): Promise<string[]> {
        const rows = await this.db.communityTag.findMany({
            where: { communityId },
            select: { tag: true },
            orderBy: { tag: 'asc' },
        })
        return rows.map(r => r.tag)
    }

    async deleteAllByCommunityId(communityId: string): Promise<void> {
        await this.db.communityTag.deleteMany({ where: { communityId } })
    }

    async createMany(communityId: string, tags: string[]): Promise<void> {
        if (tags.length === 0) return
        await this.db.communityTag.createMany({
            data: tags.map(tag => ({ id: randomUUID(), communityId, tag })),
        })
    }
}
