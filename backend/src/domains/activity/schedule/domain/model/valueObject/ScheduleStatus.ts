import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_STATUSES = ['SCHEDULED', 'CANCELLED'] as const
export type ScheduleStatusType = (typeof VALID_STATUSES)[number]

export class ScheduleStatus extends ValueObject<ScheduleStatusType> {
    private constructor(value: ScheduleStatusType) {
        super(value)
    }

    static create(value: string): ScheduleStatus {
        if (!VALID_STATUSES.includes(value as ScheduleStatusType)) {
            throw new DomainValidationError(
                `無効なスケジュールステータスです: ${value}`,
                'INVALID_SCHEDULE_STATUS'
            )
        }
        return new ScheduleStatus(value as ScheduleStatusType)
    }

    static scheduled(): ScheduleStatus {
        return new ScheduleStatus('SCHEDULED')
    }

    static cancelled(): ScheduleStatus {
        return new ScheduleStatus('CANCELLED')
    }

    static reconstruct(value: string): ScheduleStatus {
        return new ScheduleStatus(value as ScheduleStatusType)
    }

    isScheduled(): boolean {
        return this.value === 'SCHEDULED'
    }

    isCancelled(): boolean {
        return this.value === 'CANCELLED'
    }
}
