import type { IAlbumPhotoRepository } from '@/domains/album/domain/repository/IAlbumPhotoRepository.js'

/**
 * アルバム写真削除 UseCase。
 */
export class DeleteAlbumPhotoUseCase {
    constructor(
        private readonly albumPhotoRepository: IAlbumPhotoRepository,
    ) { }

    async execute(input: {
        photoId: string
        userId: string
    }): Promise<void> {
        const photo = await this.albumPhotoRepository.findById(input.photoId)
        if (!photo) {
            throw new Error('写真が見つかりません')
        }
        if (photo.uploadedBy !== input.userId) {
            throw new Error('他のユーザーの写真は削除できません')
        }
        await this.albumPhotoRepository.delete(input.photoId)
    }
}
