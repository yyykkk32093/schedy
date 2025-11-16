import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class PlainPassword extends ValueObject<string> {
    constructor(value: string) {
        if (!value || value.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }
        super(value)
    }
}
