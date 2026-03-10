import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from './ValueObject.js'

export class UserId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserId {
    if (!value || value.trim() === '') {
      throw new DomainValidationError('UserId cannot be empty', 'INVALID_USER_ID')
    }
    return new UserId(value)
  }
}
