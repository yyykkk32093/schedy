import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * デフォルトの場所（Activity のデフォルト設定）。
 */
export class DefaultLocation extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): DefaultLocation {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('場所は空にできません', 'INVALID_DEFAULT_LOCATION')
        }
        return new DefaultLocation(value.trim())
    }

    static createNullable(value?: string | null): DefaultLocation | null {
        if (value == null || value.trim() === '') return null
        return DefaultLocation.create(value)
    }

    static reconstruct(value: string): DefaultLocation {
        return new DefaultLocation(value)
    }
}
