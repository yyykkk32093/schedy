import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class PollOptionText extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): PollOptionText {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('選択肢のテキストは空にできません', 'INVALID_POLL_OPTION_TEXT')
        }
        if (value.length > 200) {
            throw new DomainValidationError('選択肢のテキストは200文字以内にしてください', 'POLL_OPTION_TEXT_TOO_LONG')
        }
        return new PollOptionText(value.trim())
    }

    static reconstruct(value: string): PollOptionText {
        return new PollOptionText(value)
    }
}
