import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class CommunityDescription extends ValueObject<string> {
    private static readonly MAX_LENGTH = 500

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): CommunityDescription {
        if (value.length > CommunityDescription.MAX_LENGTH) {
            throw new DomainValidationError(
                `コミュニティ説明は${CommunityDescription.MAX_LENGTH}文字以内で入力してください`,
                'INVALID_COMMUNITY_DESCRIPTION'
            )
        }
        return new CommunityDescription(value)
    }

    static createNullable(value?: string | null): CommunityDescription | null {
        if (value == null || value.trim() === '') return null
        return CommunityDescription.create(value)
    }

    static reconstruct(value: string): CommunityDescription {
        return new CommunityDescription(value)
    }
}
