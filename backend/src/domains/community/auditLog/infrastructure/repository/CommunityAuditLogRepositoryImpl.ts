import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import { CommunityAuditLog } from '../../domain/model/entity/CommunityAuditLog.js'
import type { ICommunityAuditLogRepository } from '../../domain/repository/ICommunityAuditLogRepository.js'

export class CommunityAuditLogRepositoryImpl implements ICommunityAuditLogRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma,
    ) { }

    async save(log: CommunityAuditLog): Promise<void> {
        await this.db.communityAuditLog.create({
            data: {
                communityId: log.communityId,
                actorUserId: log.actorUserId,
                action: log.action,
                field: log.field,
                before: log.before,
                after: log.after,
                summary: log.summary,
            },
        })
    }

    async findByCommunityId(communityId: string, limit = 50): Promise<CommunityAuditLog[]> {
        const rows = await this.db.communityAuditLog.findMany({
            where: { communityId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        return rows.map((r) => new CommunityAuditLog({
            id: r.id,
            communityId: r.communityId,
            actorUserId: r.actorUserId,
            action: r.action,
            field: r.field,
            before: r.before,
            after: r.after,
            summary: r.summary,
            createdAt: r.createdAt,
        }))
    }
}
