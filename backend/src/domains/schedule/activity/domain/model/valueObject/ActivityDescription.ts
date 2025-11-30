// src/domains/schedule/activity/domain/model/valueObject/ActivityDescription.ts
import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class ActivityDescription extends ValueObject<string | null> {
    private constructor(value: string | null) {
        super(value)
    }

    static create(value: string | null): ActivityDescription {
        if (value && value.length > 500) {
            throw new Error("ActivityDescription must be 500 characters or less.")
        }
        return new ActivityDescription(value ?? null)
    }
}
