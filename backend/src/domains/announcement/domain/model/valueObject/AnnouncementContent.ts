import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class AnnouncementContent extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): AnnouncementContent {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('本文は空にできません', 'INVALID_ANNOUNCEMENT_CONTENT')
        }
        if (value.length > 10000) {
            throw new DomainValidationError('本文は10000文字以内にしてください', 'ANNOUNCEMENT_CONTENT_TOO_LONG')
        }
        return new AnnouncementContent(value)
    }

    static reconstruct(value: string): AnnouncementContent {
        return new AnnouncementContent(value)
    }
}
