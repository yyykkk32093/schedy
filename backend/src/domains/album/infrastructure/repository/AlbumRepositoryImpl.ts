import type { Prisma, PrismaClient } from '@prisma/client';
import type { AlbumRow, IAlbumRepository } from '../../domain/repository/IAlbumRepository.js';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AlbumRepositoryImpl implements IAlbumRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async create(params: { id: string; communityId: string; title: string; description?: string; createdBy: string }): Promise<void> {
        await this.prisma.album.create({
            data: {
                id: params.id,
                communityId: params.communityId,
                title: params.title,
                description: params.description ?? null,
                createdBy: params.createdBy,
            },
        })
    }

    async findById(id: string): Promise<AlbumRow | null> {
        const row = await this.prisma.album.findUnique({
            where: { id },
            include: {
                photos: { select: { fileUrl: true }, take: 1, orderBy: { createdAt: 'desc' } },
                _count: { select: { photos: true } },
            },
        })
        if (!row) return null
        return {
            id: row.id,
            communityId: row.communityId,
            title: row.title,
            description: row.description,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            photoCount: row._count.photos,
            coverUrl: row.photos[0]?.fileUrl ?? null,
        }
    }

    async findsByCommunityId(communityId: string): Promise<AlbumRow[]> {
        const rows = await this.prisma.album.findMany({
            where: { communityId },
            orderBy: { createdAt: 'desc' },
            include: {
                photos: { select: { fileUrl: true }, take: 1, orderBy: { createdAt: 'desc' } },
                _count: { select: { photos: true } },
            },
        })
        return rows.map((r) => ({
            id: r.id,
            communityId: r.communityId,
            title: r.title,
            description: r.description,
            createdBy: r.createdBy,
            createdAt: r.createdAt,
            photoCount: r._count.photos,
            coverUrl: r.photos[0]?.fileUrl ?? null,
        }))
    }

    async delete(id: string): Promise<void> {
        await this.prisma.album.delete({ where: { id } })
    }
}
