// src/domains/schedule/activity/domain/model/valueObject/ActivityId.ts
import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class ActivityId extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityId {
        if (!value || value.trim() === "") {
            throw new Error("ActivityId cannot be empty.")
        }
        return new ActivityId(value)
    }

    static new(idGenerator: { generate(): string }): ActivityId {
        return new ActivityId(idGenerator.generate())
    }
}
