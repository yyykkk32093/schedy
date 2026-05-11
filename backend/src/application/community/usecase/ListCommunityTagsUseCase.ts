import type { ICommunityTagRepository } from '@/domains/community/domain/repository/ICommunityTagRepository.js'

export class ListCommunityTagsUseCase {
    constructor(private readonly tagRepository: ICommunityTagRepository) { }

    async execute(input: { communityId: string }): Promise<{ tags: string[] }> {
        const tags = await this.tagRepository.findByCommunityId(input.communityId)
        return { tags }
    }
}
