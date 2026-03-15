import type { Prisma, PrismaClient } from '@prisma/client'
import { ParticipationAuditLog } from '../../domain/model/entity/ParticipationAuditLog.js'
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

    async findLatestCancellation(scheduleId: string, userId: string): Promise<ParticipationAuditLog | null> {
        const row = await this.prisma.participationAuditLog.findFirst({
            where: {
                scheduleId,
                userId,
                action: 'CANCELLED',
            },
            orderBy: { createdAt: 'desc' },
        })
        if (!row) return null
        return new ParticipationAuditLog({
            id: row.id,
            scheduleId: row.scheduleId,
            userId: row.userId,
            action: row.action,
            cancelledAt: row.cancelledAt,
            paymentMethod: row.paymentMethod,
            paymentStatus: row.paymentStatus,
            createdAt: row.createdAt,
        })
    }
}
