import type { CommunityMembership } from '../model/entity/CommunityMembership.js'

export interface ICommunityMembershipRepository {
    findById(id: string): Promise<CommunityMembership | null>
    findByCommunityAndUser(communityId: string, userId: string): Promise<CommunityMembership | null>
    findsByCommunityId(communityId: string): Promise<CommunityMembership[]>
    findsByUserId(userId: string): Promise<CommunityMembership[]>
    save(membership: CommunityMembership): Promise<void>
}
