// src/domains/audit/log/infrastructure/repository/AuditLogRepositoryImpl.ts
import { AuditLog } from '@/domains/audit/log/domain/model/entity/AuditLog.js'
import { prisma } from '@/sharedTech/db/client.js'
import { IAuditLogRepository } from '../../domain/repository/IAuditLogRepository.js'

/**
 * 🔹 Prisma実装によるAuditLogRepository。
 * 個人情報を扱わず、ログイベントの基本情報のみ保存。
 */
export class AuditLogRepository implements IAuditLogRepository {
    async save(log: AuditLog): Promise<void> {
        await prisma.auditLog.create({
            data: {
                id: log.id,
                eventName: log.eventName,
                userId: log.userId,
                authMethod: log.authMethod,
                occurredAt: log.occurredAt,
                createdAt: log.createdAt,
            },
        })
    }

    async findByUserId(userId: string): Promise<AuditLog[]> {
        const rows = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { occurredAt: 'desc' },
        })
        return rows.map(
            (r) =>
                new AuditLog(
                    { generate: () => r.id }, // IDは既存のものをそのまま保持
                    {
                        id: r.id,
                        eventName: r.eventName,
                        userId: r.userId,
                        authMethod: r.authMethod,
                        occurredAt: r.occurredAt,
                        createdAt: r.createdAt,
                    },
                ),
        )
    }
}
