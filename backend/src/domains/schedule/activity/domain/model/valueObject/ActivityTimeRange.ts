// domains/schedule/activity/domain/model/valueObject/ActivityTimeRange.ts
import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class ActivityTimeRange extends ValueObject<{ startAt: Date, endAt: Date }> {

    private constructor(value: { startAt: Date, endAt: Date }) {
        super(value)
    }

    static create(startAt: Date, endAt: Date): ActivityTimeRange {
        if (endAt <= startAt) {
            throw new Error("ActivityTimeRange endAt must be after startAt")
        }
        return new ActivityTimeRange({ startAt, endAt })
    }

    get startAt() {
        return this.value.startAt
    }

    get endAt() {
        return this.value.endAt
    }

    toJSON() {
        return {
            startAt: this.startAt.toISOString(),
            endAt: this.endAt.toISOString()
        }
    }
}
