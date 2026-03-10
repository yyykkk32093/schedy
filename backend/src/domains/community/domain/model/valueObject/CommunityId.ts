import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class CommunityId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): CommunityId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('CommunityId は空にできません', 'INVALID_COMMUNITY_ID')
        }
        return new CommunityId(value)
    }

    static reconstruct(value: string): CommunityId {
        return new CommunityId(value)
    }
}
