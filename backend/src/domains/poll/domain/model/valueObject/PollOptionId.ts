import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class PollOptionId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): PollOptionId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('PollOptionId は空にできません', 'INVALID_POLL_OPTION_ID')
        }
        return new PollOptionId(value)
    }

    static reconstruct(value: string): PollOptionId {
        return new PollOptionId(value)
    }
}
