import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class ActivityId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('ActivityId は空にできません', 'INVALID_ACTIVITY_ID')
        }
        return new ActivityId(value)
    }

    static reconstruct(value: string): ActivityId {
        return new ActivityId(value)
    }
}
