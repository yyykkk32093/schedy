import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class Biography extends ValueObject<string> {
    static readonly MAX_LENGTH = 200

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): Biography {
        if (value.length > Biography.MAX_LENGTH) {
            throw new DomainValidationError(`Biography must be ${Biography.MAX_LENGTH} characters or less`, 'INVALID_BIOGRAPHY')
        }
        return new Biography(value)
    }

    static reconstruct(value: string): Biography {
        return new Biography(value)
    }
}
