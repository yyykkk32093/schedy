import { ValueObject } from './ValueObject.js'

export class UserId extends ValueObject<string> {
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('UserId cannot be empty')
    }
    super(value)
  }
}
