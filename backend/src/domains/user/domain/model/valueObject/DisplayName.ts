// src/domains/user/domain/model/valueObject/DisplayName.ts
import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class DisplayName extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): DisplayName {
        const trimmed = value.trim()
        if (!trimmed) {
            throw new DomainValidationError('DisplayName must not be empty', 'INVALID_DISPLAY_NAME')
        }
        if (trimmed.length > 50) {
            throw new DomainValidationError('DisplayName must be 50 characters or less', 'INVALID_DISPLAY_NAME')
        }
        return new DisplayName(trimmed)
    }

    static createNullable(value: string | null | undefined): DisplayName | null {
        if (value == null) return null
        return DisplayName.create(value)
    }

    static reconstruct(value: string): DisplayName {
        // DBの値は信頼
        return new DisplayName(value)
    }
}
