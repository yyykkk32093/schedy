import type { IStampRepository, StampRow } from '@/domains/stamp/domain/repository/IStampRepository.js';
import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class StampRepositoryImpl implements IStampRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async countByUser(userId: string): Promise<number> {
        return this.db.stamp.count({ where: { createdByUserId: userId } })
    }

    async create(input: { createdByUserId: string; name: string; imageUrl: string }): Promise<StampRow> {
        return this.db.stamp.create({ data: input })
    }

    async findById(id: string): Promise<StampRow | null> {
        return this.db.stamp.findUnique({ where: { id } })
    }

    async listByUser(userId: string): Promise<StampRow[]> {
        return this.db.stamp.findMany({
            where: { createdByUserId: userId },
            orderBy: { createdAt: 'desc' },
        })
    }

    async deleteWithReactions(id: string): Promise<void> {
        const dbAny = this.db as unknown as { $transaction?: PrismaClient['$transaction'] }
        if (dbAny.$transaction) {
            await (this.db as PrismaClient).$transaction([
                this.db.messageReaction.deleteMany({ where: { stampId: id } }),
                this.db.stamp.delete({ where: { id } }),
            ])
            return
        }
        await this.db.messageReaction.deleteMany({ where: { stampId: id } })
        await this.db.stamp.delete({ where: { id } })
    }
}
