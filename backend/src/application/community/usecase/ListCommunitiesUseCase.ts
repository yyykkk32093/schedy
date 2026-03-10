import type { CommunityListItem, ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'

export class ListCommunitiesUseCase {
    constructor(
        private readonly communityRepository: ICommunityRepository,
    ) { }

    async execute(input: { userId: string }): Promise<{
        communities: CommunityListItem[]
    }> {
        const communities = await this.communityRepository.findListByMemberUserId(input.userId)
        return { communities }
    }
}
