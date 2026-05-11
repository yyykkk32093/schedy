import type {
    BookmarkedCommunityListItem,
    ICommunityBookmarkRepository,
} from '@/domains/community/domain/repository/ICommunityBookmarkRepository.js'
import type { Prisma, PrismaClient } from '@prisma/client'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class CommunityBookmarkRepositoryImpl implements ICommunityBookmarkRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async findCommunityIdsByUserId(userId: string): Promise<string[]> {
        const rows = await this.db.communityBookmark.findMany({
            where: { userId },
            select: { communityId: true },
        })
        return rows.map((r) => r.communityId)
    }

    async findBookmarkedCommunitiesByUserId(
        userId: string,
    ): Promise<BookmarkedCommunityListItem[]> {
        const rows = await this.db.communityBookmark.findMany({
            where: { userId },
            include: {
                community: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        logoUrl: true,
                        coverUrl: true,
                        joinMethod: true,
                        isPublic: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((b) => b.community)
    }

    async add(communityId: string, userId: string): Promise<void> {
        await this.db.communityBookmark.upsert({
            where: { communityId_userId: { communityId, userId } },
            update: {},
            create: { communityId, userId },
        })
    }

    async remove(communityId: string, userId: string): Promise<void> {
        await this.db.communityBookmark.deleteMany({
            where: { communityId, userId },
        })
    }
}
