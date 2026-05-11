import type { Prisma, PrismaClient } from '@prisma/client'
import type { IAnnouncementBookmarkRepository } from '../../domain/repository/IAnnouncementBookmarkRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementBookmarkRepositoryImpl implements IAnnouncementBookmarkRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async add(announcementId: string, userId: string): Promise<void> {
        await this.prisma.announcementBookmark.upsert({
            where: { announcementId_userId: { announcementId, userId } },
            create: { announcementId, userId },
            update: {},
        })
    }

    async remove(announcementId: string, userId: string): Promise<void> {
        await this.prisma.announcementBookmark.deleteMany({
            where: { announcementId, userId },
        })
    }

    async isBookmarked(announcementId: string, userId: string): Promise<boolean> {
        const row = await this.prisma.announcementBookmark.findUnique({
            where: { announcementId_userId: { announcementId, userId } },
        })
        return row !== null
    }

    async findBookmarkedIds(userId: string, announcementIds: string[]): Promise<string[]> {
        if (announcementIds.length === 0) return []
        const rows = await this.prisma.announcementBookmark.findMany({
            where: { userId, announcementId: { in: announcementIds } },
            select: { announcementId: true },
        })
        return rows.map((r) => r.announcementId)
    }

    async findBookmarkedAnnouncementIds(
        userId: string,
        options: { cursor?: string; limit: number },
    ): Promise<string[]> {
        const rows = await this.prisma.announcementBookmark.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: options.limit,
            ...(options.cursor
                ? { cursor: { id: options.cursor }, skip: 1 }
                : {}),
            select: { announcementId: true, id: true },
        })
        return rows.map((r) => r.announcementId)
    }
}
