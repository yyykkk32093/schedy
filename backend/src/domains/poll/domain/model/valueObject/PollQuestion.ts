import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export class PollQuestion extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): PollQuestion {
        if (!value || value.trim().length === 0) {
            throw new DomainValidationError('質問は空にできません', 'INVALID_POLL_QUESTION')
        }
        if (value.length > 500) {
            throw new DomainValidationError('質問は500文字以内にしてください', 'POLL_QUESTION_TOO_LONG')
        }
        return new PollQuestion(value.trim())
    }

    static reconstruct(value: string): PollQuestion {
        return new PollQuestion(value)
    }
}
