import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class AnnouncementTitle extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): AnnouncementTitle {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('タイトルは空にできません', 'INVALID_ANNOUNCEMENT_TITLE')
        }
        if (value.length > 200) {
            throw new DomainValidationError('タイトルは200文字以内にしてください', 'ANNOUNCEMENT_TITLE_TOO_LONG')
        }
        return new AnnouncementTitle(value.trim())
    }

    static reconstruct(value: string): AnnouncementTitle {
        return new AnnouncementTitle(value)
    }
}
