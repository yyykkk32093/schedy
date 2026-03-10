import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * 時刻を表す値オブジェクト（"HH:mm" 形式）。
 * Activity のデフォルト開始時刻/終了時刻、Schedule の時刻で使用。
 */
export class TimeOfDay extends ValueObject<string> {
    private constructor(value: string) {
        super(value)
    }

    static create(value: string): TimeOfDay {
        if (!TIME_REGEX.test(value)) {
            throw new DomainValidationError(
                `時刻の形式が不正です: ${value} (HH:mm 形式で入力してください)`,
                'INVALID_TIME_FORMAT'
            )
        }
        return new TimeOfDay(value)
    }

    static createNullable(value?: string | null): TimeOfDay | null {
        if (value == null || value.trim() === '') return null
        return TimeOfDay.create(value)
    }

    static reconstruct(value: string): TimeOfDay {
        return new TimeOfDay(value)
    }

    /** 分単位に変換（比較用） */
    toMinutes(): number {
        const [h, m] = this.value.split(':').map(Number)
        return h * 60 + m
    }

    isBefore(other: TimeOfDay): boolean {
        return this.toMinutes() < other.toMinutes()
    }
}
