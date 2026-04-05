import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

interface LevelRangeProps {
    min: number
    max: number
}

/**
 * 参加レベル範囲を表す値オブジェクト。
 * - min: 0〜8 (0=初心者, 8=プロ)
 * - max: min〜8
 * - DB保存時は "2-5" 形式の文字列に変換
 */
export class LevelRange extends ValueObject<LevelRangeProps> {
    static readonly MIN_LEVEL = 0
    static readonly MAX_LEVEL = 8

    private constructor(value: LevelRangeProps) {
        super(value)
    }

    static create(min: number, max: number): LevelRange {
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            throw new DomainValidationError('レベルは整数で指定してください', 'INVALID_LEVEL_RANGE')
        }
        if (min < LevelRange.MIN_LEVEL || min > LevelRange.MAX_LEVEL) {
            throw new DomainValidationError(
                `最小レベルは${LevelRange.MIN_LEVEL}〜${LevelRange.MAX_LEVEL}の範囲で指定してください`,
                'INVALID_LEVEL_RANGE',
            )
        }
        if (max < min || max > LevelRange.MAX_LEVEL) {
            throw new DomainValidationError(
                `最大レベルは最小レベル以上${LevelRange.MAX_LEVEL}以下で指定してください`,
                'INVALID_LEVEL_RANGE',
            )
        }
        return new LevelRange({ min, max })
    }

    /** "2-5" 形式の文字列からパース */
    static fromString(value: string): LevelRange {
        const match = value.match(/^(\d)-(\d)$/)
        if (!match) {
            throw new DomainValidationError(
                `レベル範囲の形式が不正です: ${value} ("2-5" 形式で入力してください)`,
                'INVALID_LEVEL_RANGE_FORMAT',
            )
        }
        return LevelRange.create(Number(match[1]), Number(match[2]))
    }

    static createNullable(value?: string | null): LevelRange | null {
        if (value == null || value.trim() === '') return null
        return LevelRange.fromString(value)
    }

    static reconstruct(value: string): LevelRange {
        return LevelRange.createNullable(value) ?? LevelRange.create(0, 8)
    }

    get min(): number {
        return this.value.min
    }

    get max(): number {
        return this.value.max
    }

    /** DB保存用: "2-5" 形式 */
    toDBString(): string {
        return `${this.value.min}-${this.value.max}`
    }

    static readonly LEVEL_LABELS: Record<number, string> = {
        0: '初心者',
        1: '入門',
        2: '初級',
        3: '初中級',
        4: '中級',
        5: '中上級',
        6: '上級',
        7: '最上級',
        8: 'プロ',
    }

    /** 表示用: "初級〜中級" 形式 */
    toDisplayLabel(): string {
        return `${LevelRange.LEVEL_LABELS[this.value.min]}〜${LevelRange.LEVEL_LABELS[this.value.max]}`
    }

    override toString(): string {
        return this.toDBString()
    }
}
