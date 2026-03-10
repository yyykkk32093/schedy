import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class AnnouncementId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): AnnouncementId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('AnnouncementId は空にできません', 'INVALID_ANNOUNCEMENT_ID')
        }
        return new AnnouncementId(value)
    }

    static reconstruct(value: string): AnnouncementId {
        return new AnnouncementId(value)
    }
}
