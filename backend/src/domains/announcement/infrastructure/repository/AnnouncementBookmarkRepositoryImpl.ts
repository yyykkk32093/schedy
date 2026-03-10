import type { Prisma, PrismaClient } from '@prisma/client'
import type { IAnnouncementBookmarkRepository } from '../../domain/repository/IAnnouncementBookmarkRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementBookmarkRepositoryImpl implements IAnnouncementBookmarkRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async toggle(announcementId: string, userId: string): Promise<{ bookmarked: boolean }> {
        const existing = await this.prisma.announcementBookmark.findUnique({
            where: { announcementId_userId: { announcementId, userId } },
        })

        if (existing) {
            await this.prisma.announcementBookmark.delete({ where: { id: existing.id } })
            return { bookmarked: false }
        }

        await this.prisma.announcementBookmark.create({
            data: { announcementId, userId },
        })
        return { bookmarked: true }
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
