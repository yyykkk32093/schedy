// src/application/auth/error/AuthenticationFailedError.ts

export type AuthFailureReason =
    | 'USER_NOT_FOUND'
    | 'CREDENTIAL_NOT_FOUND'
    | 'INVALID_CREDENTIALS'

/**
 * 認証失敗（API向け）
 *
 * - HTTP応答の理由コード（reason）を型で固定する
 * - ステータスは基本 401（仕様に合わせる）
 */
export class AuthenticationFailedError extends Error {
    readonly reason: AuthFailureReason
    readonly statusCode: number

    constructor(params: { reason: AuthFailureReason; statusCode?: number }) {
        super(params.reason)
        this.reason = params.reason
        this.statusCode = params.statusCode ?? 401
        this.name = 'AuthenticationFailedError'
    }
}
