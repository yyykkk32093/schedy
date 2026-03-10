import type {
    ICommunityRepository,
    PublicCommunitySearchItem,
    SearchCommunitiesParams,
} from '@/domains/community/domain/repository/ICommunityRepository.js'

export class SearchCommunitiesUseCase {
    constructor(
        private readonly communityRepository: ICommunityRepository,
    ) { }

    async execute(input: SearchCommunitiesParams): Promise<{
        communities: PublicCommunitySearchItem[]
        total: number
    }> {
        const { items, total } = await this.communityRepository.searchPublic(input)
        return { communities: items, total }
    }
}
