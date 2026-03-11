import type { Prisma, PrismaClient } from '@prisma/client'
import type { WaitlistAuditLog } from '../../domain/model/entity/WaitlistAuditLog.js'
import type { IWaitlistAuditLogRepository } from '../../domain/repository/IWaitlistAuditLogRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class WaitlistAuditLogRepositoryImpl implements IWaitlistAuditLogRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async save(log: WaitlistAuditLog): Promise<void> {
        await this.prisma.waitlistAuditLog.create({
            data: {
                scheduleId: log.scheduleId,
                userId: log.userId,
                action: log.action,
            },
        })
    }
}
