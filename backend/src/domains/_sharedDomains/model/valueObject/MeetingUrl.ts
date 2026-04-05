import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * オンライン会議URLを表す値オブジェクト。
 * - 有効なURL形式であること
 * - http/https のみ許可
 * - Zoom, Google Meet, Teams 等のURLを想定
 */
export class MeetingUrl extends ValueObject<string> {
    private static readonly URL_PATTERN = /^https?:\/\/.+/

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): MeetingUrl {
        if (!MeetingUrl.URL_PATTERN.test(value)) {
            throw new DomainValidationError(
                `会議URLの形式が不正です: ${value}`,
                'INVALID_MEETING_URL',
            )
        }
        return new MeetingUrl(value)
    }

    static createNullable(value?: string | null): MeetingUrl | null {
        if (value == null || value.trim() === '') return null
        return MeetingUrl.create(value)
    }

    static reconstruct(value: string): MeetingUrl {
        return new MeetingUrl(value)
    }

    get url(): string {
        return this.value
    }

    override toString(): string {
        return this.value
    }
}
