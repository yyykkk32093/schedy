import type { CommunityDetail, ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'

export class FindCommunityUseCase {
    constructor(
        private readonly communityRepository: ICommunityRepository,
    ) { }

    async execute(input: { communityId: string }): Promise<CommunityDetail> {
        const detail = await this.communityRepository.findDetailById(input.communityId)
        if (!detail) throw new CommunityNotFoundError()
        return detail
    }
}
