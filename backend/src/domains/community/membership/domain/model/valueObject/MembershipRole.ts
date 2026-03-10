import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const
export type MembershipRoleType = (typeof VALID_ROLES)[number]

export class MembershipRole extends ValueObject<MembershipRoleType> {
    private constructor(value: MembershipRoleType) {
        super(value)
    }

    static create(value: string): MembershipRole {
        if (!VALID_ROLES.includes(value as MembershipRoleType)) {
            throw new DomainValidationError(
                `無効なメンバーシップロールです: ${value}`,
                'INVALID_MEMBERSHIP_ROLE'
            )
        }
        return new MembershipRole(value as MembershipRoleType)
    }

    static reconstruct(value: string): MembershipRole {
        return new MembershipRole(value as MembershipRoleType)
    }

    static owner(): MembershipRole {
        return new MembershipRole('OWNER')
    }

    static admin(): MembershipRole {
        return new MembershipRole('ADMIN')
    }

    static member(): MembershipRole {
        return new MembershipRole('MEMBER')
    }

    isOwner(): boolean {
        return this.value === 'OWNER'
    }

    isAdmin(): boolean {
        return this.value === 'ADMIN'
    }

    canManageMembers(): boolean {
        return this.value === 'OWNER' || this.value === 'ADMIN'
    }
}
