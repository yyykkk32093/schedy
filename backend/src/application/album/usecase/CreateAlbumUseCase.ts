import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IAlbumRepository } from '@/domains/album/domain/repository/IAlbumRepository.js'

/**
 * アルバム作成 UseCase。
 */
export class CreateAlbumUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly albumRepository: IAlbumRepository,
    ) { }

    async execute(input: {
        communityId: string
        title: string
        description?: string
        userId: string
    }): Promise<{ albumId: string }> {
        if (!input.title.trim()) {
            throw new Error('アルバム名は必須です')
        }

        const id = this.idGenerator.generate()
        await this.albumRepository.create({
            id,
            communityId: input.communityId,
            title: input.title.trim(),
            description: input.description?.trim(),
            createdBy: input.userId,
        })

        return { albumId: id }
    }
}
