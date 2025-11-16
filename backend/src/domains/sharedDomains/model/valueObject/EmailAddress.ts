import { ValueObject } from './ValueObject.js'

export class EmailAddress extends ValueObject<string> {
    constructor(value: string) {
        if (!EmailAddress.isValid(value)) {
            throw new Error('Invalid email address')
        }
        super(value)
    }

    static isValid(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
}
