import type { Prisma, PrismaClient } from '@prisma/client'
import type { IAnnouncementLikeRepository } from '../../domain/repository/IAnnouncementLikeRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementLikeRepositoryImpl implements IAnnouncementLikeRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async add(announcementId: string, userId: string): Promise<void> {
        // 冪等: 既に存在する場合は何もしない
        await this.prisma.announcementLike.upsert({
            where: { announcementId_userId: { announcementId, userId } },
            create: { announcementId, userId },
            update: {},
        })
    }

    async remove(announcementId: string, userId: string): Promise<void> {
        // 冪等: 存在しない場合は何もしない
        await this.prisma.announcementLike.deleteMany({
            where: { announcementId, userId },
        })
    }

    async countByAnnouncementId(announcementId: string): Promise<number> {
        return this.prisma.announcementLike.count({ where: { announcementId } })
    }

    async countByAnnouncementIds(announcementIds: string[]): Promise<Map<string, number>> {
        if (announcementIds.length === 0) return new Map()
        const rows = await this.prisma.announcementLike.groupBy({
            by: ['announcementId'],
            where: { announcementId: { in: announcementIds } },
            _count: true,
        })
        const map = new Map<string, number>()
        for (const r of rows) {
            map.set(r.announcementId, r._count)
        }
        return map
    }

    async isLiked(announcementId: string, userId: string): Promise<boolean> {
        const row = await this.prisma.announcementLike.findUnique({
            where: { announcementId_userId: { announcementId, userId } },
        })
        return row !== null
    }

    async findLikedIds(userId: string, announcementIds: string[]): Promise<string[]> {
        if (announcementIds.length === 0) return []
        const rows = await this.prisma.announcementLike.findMany({
            where: { userId, announcementId: { in: announcementIds } },
            select: { announcementId: true },
        })
        return rows.map((r) => r.announcementId)
    }
}
