import type {
    BookmarkedCommunityListItem,
    ICommunityBookmarkRepository,
} from '@/domains/community/domain/repository/ICommunityBookmarkRepository.js';

export class AddCommunityBookmarkUseCase {
    constructor(private readonly repository: ICommunityBookmarkRepository) { }

    async execute(input: { communityId: string; userId: string }): Promise<void> {
        await this.repository.add(input.communityId, input.userId)
    }
}

export class RemoveCommunityBookmarkUseCase {
    constructor(private readonly repository: ICommunityBookmarkRepository) { }

    async execute(input: { communityId: string; userId: string }): Promise<void> {
        await this.repository.remove(input.communityId, input.userId)
    }
}

export class ListBookmarkedCommunitiesUseCase {
    constructor(private readonly repository: ICommunityBookmarkRepository) { }

    async execute(input: { userId: string }): Promise<{ communities: BookmarkedCommunityListItem[] }> {
        const communities = await this.repository.findBookmarkedCommunitiesByUserId(input.userId)
        return { communities }
    }
}
