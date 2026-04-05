import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

/**
 * 画像URLを表す値オブジェクト。
 * - 有効なURL形式であること
 * - http/https のみ許可
 */
export class ImageUrl extends ValueObject<string> {
    private static readonly URL_PATTERN = /^https?:\/\/.+/

    private constructor(value: string) {
        super(value)
    }

    static create(value: string): ImageUrl {
        if (!ImageUrl.URL_PATTERN.test(value)) {
            throw new DomainValidationError(
                `画像URLの形式が不正です: ${value}`,
                'INVALID_IMAGE_URL',
            )
        }
        return new ImageUrl(value)
    }

    static createNullable(value?: string | null): ImageUrl | null {
        if (value == null || value.trim() === '') return null
        return ImageUrl.create(value)
    }

    static reconstruct(value: string): ImageUrl {
        return new ImageUrl(value)
    }

    get url(): string {
        return this.value
    }

    override toString(): string {
        return this.value
    }
}
