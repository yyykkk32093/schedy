import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class Biography extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): Biography {
        if (value.length > 500) {
            throw new DomainValidationError('Biography must be 500 characters or less', 'INVALID_BIOGRAPHY')
        }
        return new Biography(value)
    }

    static reconstruct(value: string): Biography {
        return new Biography(value)
    }
}
