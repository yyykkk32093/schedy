import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class ActivityDescription extends ValueObject<string> {
    private static readonly MAX_LENGTH = 500

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityDescription {
        if (value.length > ActivityDescription.MAX_LENGTH) {
            throw new DomainValidationError(
                `説明は${ActivityDescription.MAX_LENGTH}文字以内で入力してください`,
                'INVALID_ACTIVITY_DESCRIPTION'
            )
        }
        return new ActivityDescription(value)
    }

    static createNullable(value?: string | null): ActivityDescription | null {
        if (value == null || value.trim() === '') return null
        return ActivityDescription.create(value)
    }

    static reconstruct(value: string): ActivityDescription {
        return new ActivityDescription(value)
    }
}
