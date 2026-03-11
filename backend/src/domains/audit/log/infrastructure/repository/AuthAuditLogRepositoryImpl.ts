import type { Prisma, PrismaClient } from '@prisma/client'
import type { AuthAuditLog } from '../../domain/model/entity/AuthAuditLog.js'
import type { IAuthAuditLogRepository } from '../../domain/repository/IAuthAuditLogRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AuthAuditLogRepositoryImpl implements IAuthAuditLogRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async save(log: AuthAuditLog): Promise<void> {
        await this.db.authAuditLog.create({
            data: {
                action: log.action,
                userId: log.userId,
                authMethod: log.authMethod,
                detail: log.detail,
                occurredAt: log.occurredAt,
            },
        })
    }
}
