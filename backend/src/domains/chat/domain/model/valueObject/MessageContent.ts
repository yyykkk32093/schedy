import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const MAX_LENGTH = 500

export class MessageContent extends ValueObject<string> {
    constructor(value: string) {
        const trimmed = value?.trim()
        if (!trimmed || trimmed.length === 0) {
            throw new DomainValidationError('INVALID_CONTENT', 'メッセージ内容が空です')
        }
        if (trimmed.length > MAX_LENGTH) {
            throw new DomainValidationError('CONTENT_TOO_LONG', `メッセージは${MAX_LENGTH}文字以内で入力してください`)
        }
        super(trimmed)
    }
}
