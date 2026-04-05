import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class MessageId extends ValueObject<string> {
    constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('MessageId must not be empty')
        }
        super(value)
    }
}
