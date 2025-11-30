// domains/schedule/activity/domain/model/valueObject/ActivityLocation.ts
import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class ActivityLocation extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ActivityLocation {
        if (!value || value.trim().length === 0) {
            throw new Error("ActivityLocation must not be empty")
        }
        return new ActivityLocation(value)
    }

    toString() {
        return this.value
    }
}
