import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { ICommunityAuditLogRepository } from '../../domain/repository/ICommunityAuditLogRepository.js'

export class CommunityAuditLogRepositoryImpl implements ICommunityAuditLogRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma,
    ) { }

    async save(log: {
        communityId: string
        actorUserId: string
        action: string
        field?: string | null
        before?: string | null
        after?: string | null
        summary: string
    }): Promise<void> {
        await this.db.communityAuditLog.create({
            data: {
                communityId: log.communityId,
                actorUserId: log.actorUserId,
                action: log.action,
                field: log.field ?? null,
                before: log.before ?? null,
                after: log.after ?? null,
                summary: log.summary,
            },
        })
    }

    async findByCommunityId(communityId: string, limit = 50): Promise<Array<{
        id: string
        communityId: string
        actorUserId: string
        action: string
        field: string | null
        before: string | null
        after: string | null
        summary: string
        createdAt: Date
    }>> {
        return this.db.communityAuditLog.findMany({
            where: { communityId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })
    }
}
