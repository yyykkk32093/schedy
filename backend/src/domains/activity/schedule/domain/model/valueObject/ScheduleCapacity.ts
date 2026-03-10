import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * Schedule の定員（capacity）。
 * null = 上限なし。正の整数のみ許可。
 */
export class ScheduleCapacity extends ValueObject<number | null> {
    private constructor(value: number | null) {
        super(value)
    }

    static create(value: number | null): ScheduleCapacity {
        if (value !== null) {
            if (!Number.isInteger(value) || value < 1) {
                throw new DomainValidationError(
                    '定員は1以上の整数で指定してください',
                    'INVALID_SCHEDULE_CAPACITY'
                )
            }
        }
        return new ScheduleCapacity(value)
    }

    static createNullable(value?: number | null): ScheduleCapacity {
        return ScheduleCapacity.create(value ?? null)
    }

    static reconstruct(value: number | null): ScheduleCapacity {
        return new ScheduleCapacity(value)
    }

    hasLimit(): boolean {
        return this.value !== null
    }
}
