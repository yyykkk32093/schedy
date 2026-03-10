import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class ScheduleId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ScheduleId {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('ScheduleId は空にできません', 'INVALID_SCHEDULE_ID')
        }
        return new ScheduleId(value)
    }

    static reconstruct(value: string): ScheduleId {
        return new ScheduleId(value)
    }
}
