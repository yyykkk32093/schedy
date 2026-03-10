import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * 国際形式 +81xxxxxxxx のような表現を許可
 * 日本国内形式（090-xxxx）は非推奨 → 数字のみで扱う
 */
export class PhoneNumber extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): PhoneNumber {
        const cleaned = value.replace(/[-\s]/g, '')

        if (!/^\+?\d{7,15}$/.test(cleaned)) {
            throw new DomainValidationError('Invalid phone number format', 'INVALID_PHONE_NUMBER')
        }
        return new PhoneNumber(cleaned)
    }

    static reconstruct(value: string): PhoneNumber {
        return new PhoneNumber(value)
    }
}
