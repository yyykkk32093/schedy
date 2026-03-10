import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class ActivityTitle extends ValueObject<string> {
    private static readonly MAX_LENGTH = 100

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityTitle {
        const trimmed = value?.trim()
        if (!trimmed || trimmed.length === 0) {
            throw new DomainValidationError('タイトルは必須です', 'INVALID_ACTIVITY_TITLE')
        }
        if (trimmed.length > ActivityTitle.MAX_LENGTH) {
            throw new DomainValidationError(
                `タイトルは${ActivityTitle.MAX_LENGTH}文字以内で入力してください`,
                'INVALID_ACTIVITY_TITLE'
            )
        }
        return new ActivityTitle(trimmed)
    }

    static reconstruct(value: string): ActivityTitle {
        return new ActivityTitle(value)
    }
}
