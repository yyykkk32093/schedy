import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class CommunityName extends ValueObject<string> {
    private static readonly MIN_LENGTH = 1
    private static readonly MAX_LENGTH = 100

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): CommunityName {
        const trimmed = value?.trim()
        if (!trimmed || trimmed.length < CommunityName.MIN_LENGTH) {
            throw new DomainValidationError(
                `コミュニティ名は${CommunityName.MIN_LENGTH}文字以上で入力してください`,
                'INVALID_COMMUNITY_NAME'
            )
        }
        if (trimmed.length > CommunityName.MAX_LENGTH) {
            throw new DomainValidationError(
                `コミュニティ名は${CommunityName.MAX_LENGTH}文字以内で入力してください`,
                'INVALID_COMMUNITY_NAME'
            )
        }
        return new CommunityName(trimmed)
    }

    static reconstruct(value: string): CommunityName {
        return new CommunityName(value)
    }
}
