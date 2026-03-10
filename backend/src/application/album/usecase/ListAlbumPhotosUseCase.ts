import type { IAlbumPhotoRepository } from '@/domains/album/domain/repository/IAlbumPhotoRepository.js'

export interface AlbumPhotoDto {
    id: string
    albumId: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
    uploadedBy: string
    createdAt: string
}

/**
 * アルバム写真一覧取得 UseCase。
 */
export class ListAlbumPhotosUseCase {
    constructor(
        private readonly albumPhotoRepository: IAlbumPhotoRepository,
    ) { }

    async execute(input: {
        albumId: string
    }): Promise<{ photos: AlbumPhotoDto[] }> {
        const rows = await this.albumPhotoRepository.findsByAlbumId(input.albumId)
        return {
            photos: rows.map((r) => ({
                id: r.id,
                albumId: r.albumId,
                fileUrl: r.fileUrl,
                fileName: r.fileName,
                mimeType: r.mimeType,
                fileSize: r.fileSize,
                uploadedBy: r.uploadedBy,
                createdAt: r.createdAt.toISOString(),
            })),
        }
    }
}
