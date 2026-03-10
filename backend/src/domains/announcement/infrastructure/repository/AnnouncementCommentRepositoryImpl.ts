import type { Prisma, PrismaClient } from '@prisma/client';
import type { AnnouncementCommentRow, IAnnouncementCommentRepository } from '../../domain/repository/IAnnouncementCommentRepository.js';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementCommentRepositoryImpl implements IAnnouncementCommentRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async create(params: { id: string; announcementId: string; userId: string; content: string }): Promise<void> {
        await this.prisma.announcementComment.create({
            data: {
                id: params.id,
                announcementId: params.announcementId,
                userId: params.userId,
                content: params.content,
            },
        })
    }

    async delete(id: string): Promise<void> {
        await this.prisma.announcementComment.delete({ where: { id } })
    }

    async findById(id: string): Promise<{ id: string; announcementId: string; userId: string } | null> {
        return this.prisma.announcementComment.findUnique({
            where: { id },
            select: { id: true, announcementId: true, userId: true },
        })
    }

    async findsByAnnouncementId(
        announcementId: string,
        options?: { cursor?: string; limit?: number },
    ): Promise<AnnouncementCommentRow[]> {
        const limit = options?.limit ?? 50

        const rows = await this.prisma.announcementComment.findMany({
            where: {
                announcementId,
                ...(options?.cursor
                    ? {
                        createdAt: {
                            gt: (await this.prisma.announcementComment.findUnique({
                                where: { id: options.cursor },
                                select: { createdAt: true },
                            }))?.createdAt ?? new Date(),
                        },
                    }
                    : {}),
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        })

        // ユーザー名を取得
        const userIds = [...new Set(rows.map((r) => r.userId))]
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true, avatarUrl: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        return rows.map((r) => {
            const user = userMap.get(r.userId)
            return {
                id: r.id,
                announcementId: r.announcementId,
                userId: r.userId,
                content: r.content,
                createdAt: r.createdAt,
                userName: user?.displayName ?? null,
                userAvatarUrl: user?.avatarUrl ?? null,
            }
        })
    }

    async countByAnnouncementId(announcementId: string): Promise<number> {
        return this.prisma.announcementComment.count({ where: { announcementId } })
    }

    async countByAnnouncementIds(announcementIds: string[]): Promise<Map<string, number>> {
        if (announcementIds.length === 0) return new Map()
        const rows = await this.prisma.announcementComment.groupBy({
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
}
