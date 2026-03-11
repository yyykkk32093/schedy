import type { Prisma, PrismaClient } from '@prisma/client'
import type { ParticipationAuditLog } from '../../domain/model/entity/ParticipationAuditLog.js'
import type { IParticipationAuditLogRepository } from '../../domain/repository/IParticipationAuditLogRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ParticipationAuditLogRepositoryImpl implements IParticipationAuditLogRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async save(log: ParticipationAuditLog): Promise<void> {
        await this.prisma.participationAuditLog.create({
            data: {
                scheduleId: log.scheduleId,
                userId: log.userId,
                action: log.action,
                cancelledAt: log.cancelledAt,
                paymentMethod: log.paymentMethod,
                paymentStatus: log.paymentStatus,
            },
        })
    }
}
