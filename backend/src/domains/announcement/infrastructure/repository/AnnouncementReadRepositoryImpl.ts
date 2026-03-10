import type { Prisma, PrismaClient } from '@prisma/client'
import type { IAnnouncementReadRepository } from '../../domain/repository/IAnnouncementReadRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementReadRepositoryImpl implements IAnnouncementReadRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async markAsRead(announcementId: string, userId: string): Promise<void> {
        await this.prisma.announcementRead.upsert({
            where: {
                announcementId_userId: { announcementId, userId },
            },
            create: { announcementId, userId },
            update: {},
        })
    }

    async findReadUserIds(announcementId: string): Promise<string[]> {
        const rows = await this.prisma.announcementRead.findMany({
            where: { announcementId },
            select: { userId: true },
        })
        return rows.map((r) => r.userId)
    }

    async findReadAnnouncementIds(userId: string, announcementIds: string[]): Promise<string[]> {
        if (announcementIds.length === 0) return []
        const rows = await this.prisma.announcementRead.findMany({
            where: { userId, announcementId: { in: announcementIds } },
            select: { announcementId: true },
        })
        return rows.map((r) => r.announcementId)
    }
}
