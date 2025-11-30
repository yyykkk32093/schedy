// src/domains/schedule/activity/domain/model/valueObject/ActivityTitle.ts
import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class ActivityTitle extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityTitle {
        if (!value || value.trim() === "") {
            throw new Error("ActivityTitle cannot be empty.")
        }
        if (value.length > 100) {
            throw new Error("ActivityTitle must be 100 characters or less.")
        }
        return new ActivityTitle(value)
    }
}
