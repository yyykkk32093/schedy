import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class MembershipId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): MembershipId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('MembershipId は空にできません', 'INVALID_MEMBERSHIP_ID')
        }
        return new MembershipId(value)
    }

    static reconstruct(value: string): MembershipId {
        return new MembershipId(value)
    }
}
