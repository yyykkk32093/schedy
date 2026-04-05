import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class ChannelId extends ValueObject<string> {
    constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('ChannelId must not be empty')
        }
        super(value)
    }
}
