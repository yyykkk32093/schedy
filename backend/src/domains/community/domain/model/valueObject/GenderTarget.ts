import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'ANY'] as const
export type GenderTargetType = (typeof VALID_GENDERS)[number]

/**
 * 対象性別を表す値オブジェクト。
 * - 複数選択可（例: ['MALE', 'FEMALE']）
 * - DB保存: String[]（Prisma配列型）
 * - 'ANY' は全性別を意味（単独で使用）
 *
 * 設計判断 W4-01-D1: String[] + VO で型安全を担保（Prisma enum は使わない）
 */
export class GenderTarget extends ValueObject<GenderTargetType[]> {
    private constructor(value: GenderTargetType[]) {
        super(value)
    }

    /** 配列から作成 */
    static create(values: string[]): GenderTarget {
        if (values.length === 0) {
            return new GenderTarget(['ANY'])
        }
        for (const v of values) {
            if (!VALID_GENDERS.includes(v as GenderTargetType)) {
                throw new DomainValidationError(
                    `無効な性別指定です: ${v} (MALE, FEMALE, OTHER, ANY のいずれかを指定してください)`,
                    'INVALID_GENDER_TARGET',
                )
            }
        }
        const typed = values as GenderTargetType[]
        // ANY が含まれる場合は ANY のみに正規化
        if (typed.includes('ANY')) {
            return new GenderTarget(['ANY'])
        }
        // 重複排除
        return new GenderTarget([...new Set(typed)])
    }

    /** レガシーの単一文字列から変換（"指定なし" → ANY, "男性" → MALE 等） */
    static fromLegacyString(value: string): GenderTarget {
        const legacyMap: Record<string, GenderTargetType> = {
            '指定なし': 'ANY',
            '男性': 'MALE',
            '女性': 'FEMALE',
            'その他': 'OTHER',
        }
        const mapped = legacyMap[value]
        if (mapped) return new GenderTarget([mapped])
        // 既にVALID_GENDERSに含まれる場合
        if (VALID_GENDERS.includes(value as GenderTargetType)) {
            return new GenderTarget([value as GenderTargetType])
        }
        // 不明な値はANYとして扱う
        return new GenderTarget(['ANY'])
    }

    static createNullable(values?: string[] | string | null): GenderTarget | null {
        if (values == null) return null
        if (typeof values === 'string') return GenderTarget.fromLegacyString(values)
        if (values.length === 0) return null
        return GenderTarget.create(values)
    }

    static reconstruct(values: string[]): GenderTarget {
        return new GenderTarget(values as GenderTargetType[])
    }

    get genders(): GenderTargetType[] {
        return [...this.value]
    }

    isAny(): boolean {
        return this.value.length === 1 && this.value[0] === 'ANY'
    }

    includes(gender: GenderTargetType): boolean {
        return this.isAny() || this.value.includes(gender)
    }

    /** DB保存用: String[] */
    toDBArray(): string[] {
        return [...this.value]
    }

    /** 表示用ラベル */
    toDisplayLabel(): string {
        if (this.isAny()) return '指定なし'
        const labelMap: Record<GenderTargetType, string> = {
            MALE: '男性',
            FEMALE: '女性',
            OTHER: 'その他',
            ANY: '指定なし',
        }
        return this.value.map((g) => labelMap[g]).join(', ')
    }

    override toString(): string {
        return this.value.join(',')
    }
}
