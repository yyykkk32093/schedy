import type { CommunityLocationDTO, ICommunityLocationRepository } from '@/domains/community/domain/repository/ICommunityLocationRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

/**
 * コミュニティの活動拠点一覧を取得する。
 * メンバーであれば誰でも閲覧可能。
 */
export class ListCommunityLocationsUseCase {
    constructor(
        private readonly membershipRepository: ICommunityMembershipRepository,
        private readonly locationRepository: ICommunityLocationRepository,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
    }): Promise<{ locations: CommunityLocationDTO[] }> {
        const membership = await this.membershipRepository.findByCommunityAndUser(
            input.communityId,
            input.userId,
        )
        if (!membership || !membership.isActive()) {
            throw new CommunityPermissionError('コミュニティに所属していません')
        }

        const locations = await this.locationRepository.findByCommunityId(input.communityId)
        return { locations }
    }
}
