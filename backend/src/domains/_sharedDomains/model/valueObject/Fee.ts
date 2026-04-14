import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * 金額（参加費・ビジター費）を表す値オブジェクト。
 * - 0 以上 MAX 以下の整数（円）
 * - MAX = 100,000（アプリ上限）
 */
export class Fee extends ValueObject<number> {
    static readonly FREE = new Fee(0)
    static readonly MAX = 100_000

    private constructor(value: number) {
        super(value)
    }

    static create(value: number): Fee {
        if (!Number.isInteger(value)) {
            throw new DomainValidationError('金額は整数で指定してください', 'INVALID_FEE')
        }
        if (value < 0) {
            throw new DomainValidationError('金額は0以上で指定してください', 'INVALID_FEE')
        }
        if (value > Fee.MAX) {
            throw new DomainValidationError(`金額は${Fee.MAX.toLocaleString()}円以下で指定してください`, 'INVALID_FEE')
        }
        if (value === 0) return Fee.FREE
        return new Fee(value)
    }

    static createNullable(value?: number | null): Fee | null {
        if (value == null) return null
        return Fee.create(value)
    }

    static reconstruct(value: number): Fee {
        return new Fee(value)
    }

    get amount(): number {
        return this.value
    }

    isFree(): boolean {
        return this.value === 0
    }

    /** 表示用: "¥1,200" / "無料" */
    toDisplayLabel(): string {
        if (this.isFree()) return '無料'
        return `¥${this.value.toLocaleString()}`
    }

    override toString(): string {
        return String(this.value)
    }
}
