import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IAlbumPhotoRepository } from '@/domains/album/domain/repository/IAlbumPhotoRepository.js'
import type { IAlbumRepository } from '@/domains/album/domain/repository/IAlbumRepository.js'

/**
 * アルバム写真追加 UseCase。
 */
export class AddAlbumPhotoUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly albumRepository: IAlbumRepository,
        private readonly albumPhotoRepository: IAlbumPhotoRepository,
    ) { }

    async execute(input: {
        albumId: string
        fileUrl: string
        fileName: string
        mimeType: string
        fileSize: number
        userId: string
    }): Promise<{ photoId: string }> {
        const album = await this.albumRepository.findById(input.albumId)
        if (!album) {
            throw new Error('アルバムが見つかりません')
        }

        const id = this.idGenerator.generate()
        await this.albumPhotoRepository.create({
            id,
            albumId: input.albumId,
            fileUrl: input.fileUrl,
            fileName: input.fileName,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            uploadedBy: input.userId,
        })

        return { photoId: id }
    }
}
