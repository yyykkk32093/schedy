import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import { MembershipId } from '../valueObject/MembershipId.js'
import { MembershipRole } from '../valueObject/MembershipRole.js'

export class CommunityMembership extends AggregateRoot {
    private constructor(
        private readonly id: MembershipId,
        private readonly communityId: CommunityId,
        private readonly userId: UserId,
        private role: MembershipRole,
        private readonly joinedAt: Date,
        private leftAt: Date | null,
    ) {
        super()
    }

    /**
     * 新規メンバーシップ作成
     */
    static create(params: {
        id: MembershipId
        communityId: CommunityId
        userId: UserId
        role: MembershipRole
    }): CommunityMembership {
        return new CommunityMembership(
            params.id,
            params.communityId,
            params.userId,
            params.role,
            new Date(),
            null,
        )
    }

    /**
     * DB復元ファクトリ
     */
    static reconstruct(params: {
        id: MembershipId
        communityId: CommunityId
        userId: UserId
        role: MembershipRole
        joinedAt: Date
        leftAt: Date | null
    }): CommunityMembership {
        return new CommunityMembership(
            params.id,
            params.communityId,
            params.userId,
            params.role,
            params.joinedAt,
            params.leftAt,
        )
    }

    // ---- Behavior ----

    changeRole(newRole: MembershipRole): void {
        if (!this.isActive()) {
            throw new DomainValidationError('脱退済みメンバーのロールは変更できません', 'MEMBERSHIP_ALREADY_LEFT')
        }
        this.role = newRole
    }

    leave(): void {
        if (!this.isActive()) {
            throw new DomainValidationError('すでに脱退済みです', 'MEMBERSHIP_ALREADY_LEFT')
        }
        if (this.role.isOwner()) {
            throw new DomainValidationError(
                'OWNERは脱退できません。先に他のメンバーにOWNERを委譲してください',
                'OWNER_CANNOT_LEAVE'
            )
        }
        this.leftAt = new Date()
    }

    // ---- Query ----

    isActive(): boolean {
        return this.leftAt === null
    }

    getId(): MembershipId { return this.id }
    getCommunityId(): CommunityId { return this.communityId }
    getUserId(): UserId { return this.userId }
    getRole(): MembershipRole { return this.role }
    getJoinedAt(): Date { return this.joinedAt }
    getLeftAt(): Date | null { return this.leftAt }
}
