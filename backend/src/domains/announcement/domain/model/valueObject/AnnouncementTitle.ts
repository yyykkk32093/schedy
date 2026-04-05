import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class AnnouncementTitle extends ValueObject<string> {
    static readonly MAX_LENGTH = 100

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): AnnouncementTitle {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('タイトルは空にできません', 'INVALID_ANNOUNCEMENT_TITLE')
        }
        if (value.length > AnnouncementTitle.MAX_LENGTH) {
            throw new DomainValidationError(`タイトルは${AnnouncementTitle.MAX_LENGTH}文字以内にしてください`, 'ANNOUNCEMENT_TITLE_TOO_LONG')
        }
        return new AnnouncementTitle(value.trim())
    }

    static reconstruct(value: string): AnnouncementTitle {
        return new AnnouncementTitle(value)
    }
}
