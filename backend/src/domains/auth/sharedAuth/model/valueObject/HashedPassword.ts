import { ValueObject } from '@/domains/sharedDomains/model/valueObject/ValueObject.js'

export class HashedPassword extends ValueObject<string> {
    constructor(value: string) {
        if (!value || (!value.startsWith('$2a$') && !value.startsWith('$2b$'))) {
            throw new Error('Invalid hashed password format')
        }
        super(value)
    }
}
