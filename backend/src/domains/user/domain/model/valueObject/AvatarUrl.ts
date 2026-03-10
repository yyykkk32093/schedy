import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class AvatarUrl extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): AvatarUrl {
        if (!AvatarUrl.isValidUrl(value)) {
            throw new DomainValidationError('Invalid avatar URL', 'INVALID_AVATAR_URL')
        }
        return new AvatarUrl(value)
    }

    static reconstruct(value: string): AvatarUrl {
        return new AvatarUrl(value)
    }

    private static isValidUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }
}
