/**
 * ドメイン層のバリデーションエラー。
 * ValueObject の生成時や Entity のビジネスルール違反時に throw する。
 *
 * errorHandler で catch → HTTP 400 として返却される。
 */
export class DomainValidationError extends Error {
    readonly code: string

    constructor(message: string, code: string = 'DOMAIN_VALIDATION_ERROR') {
        super(message)
        this.code = code
        this.name = 'DomainValidationError'
    }
}
