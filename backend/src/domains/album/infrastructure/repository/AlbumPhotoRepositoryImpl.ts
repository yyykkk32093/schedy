import type { Prisma, PrismaClient } from '@prisma/client';
import type { AlbumPhotoRow, IAlbumPhotoRepository } from '../../domain/repository/IAlbumPhotoRepository.js';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AlbumPhotoRepositoryImpl implements IAlbumPhotoRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async create(params: { id: string; albumId: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number; uploadedBy: string }): Promise<void> {
        await this.prisma.albumPhoto.create({
            data: {
                id: params.id,
                albumId: params.albumId,
                fileUrl: params.fileUrl,
                fileName: params.fileName,
                mimeType: params.mimeType,
                fileSize: params.fileSize,
                uploadedBy: params.uploadedBy,
            },
        })
    }

    async findsByAlbumId(albumId: string): Promise<AlbumPhotoRow[]> {
        return this.prisma.albumPhoto.findMany({
            where: { albumId },
            orderBy: { createdAt: 'desc' },
        })
    }

    async findById(id: string): Promise<AlbumPhotoRow | null> {
        return this.prisma.albumPhoto.findUnique({ where: { id } })
    }

    async delete(id: string): Promise<void> {
        await this.prisma.albumPhoto.delete({ where: { id } })
    }
}
