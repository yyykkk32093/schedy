// src/domains/audit/log/infrastructure/repository/AuditLogRepositoryImpl.ts
import { prisma } from '@/sharedTech/db/client.js'
import { AuditLog } from '../../domain/model/entity/AuditLog.js'
import { IAuditLogRepository } from '../../domain/repository/IAuditLogRepository.js'

export class AuditLogRepositoryImpl implements IAuditLogRepository {
    async save(log: AuditLog): Promise<void> {
        await prisma.auditLog.create({
            data: {
                id: log.id,
                eventType: log.eventType,
                userId: log.userId,
                authMethod: log.authMethod,
                detail: log.detail,
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

        // 既存IDを維持したままドメインエンティティに戻す
        return rows.map(
            (r) =>
                new AuditLog(
                    { generate: () => r.id }, // IIdGenerator っぽいものを即席で実装
                    {
                        id: r.id,
                        eventType: r.eventType,
                        userId: r.userId,
                        authMethod: r.authMethod,
                        detail: r.detail,
                        occurredAt: r.occurredAt,
                        createdAt: r.createdAt,
                    },
                ),
        )
    }
}
