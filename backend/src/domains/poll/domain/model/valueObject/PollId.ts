import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class PollId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): PollId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('PollId は空にできません', 'INVALID_POLL_ID')
        }
        return new PollId(value)
    }

    static reconstruct(value: string): PollId {
        return new PollId(value)
    }
}
