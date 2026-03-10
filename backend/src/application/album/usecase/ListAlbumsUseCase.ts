import type { IAlbumRepository } from '@/domains/album/domain/repository/IAlbumRepository.js'

export interface AlbumDto {
    id: string
    communityId: string
    title: string
    description: string | null
    createdBy: string
    createdAt: string
    photoCount: number
    coverUrl: string | null
}

/**
 * アルバム一覧取得 UseCase。
 */
export class ListAlbumsUseCase {
    constructor(
        private readonly albumRepository: IAlbumRepository,
    ) { }

    async execute(input: {
        communityId: string
    }): Promise<{ albums: AlbumDto[] }> {
        const rows = await this.albumRepository.findsByCommunityId(input.communityId)
        return {
            albums: rows.map((r) => ({
                id: r.id,
                communityId: r.communityId,
                title: r.title,
                description: r.description,
                createdBy: r.createdBy,
                createdAt: r.createdAt.toISOString(),
                photoCount: r.photoCount,
                coverUrl: r.coverUrl,
            })),
        }
    }
}
