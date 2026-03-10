// src/application/auth/error/AuthenticationFailedError.ts

import { HttpError } from '@/application/_sharedApplication/error/HttpError.js';

export type AuthFailureReason =
    | 'USER_NOT_FOUND'
    | 'CREDENTIAL_NOT_FOUND'
    | 'INVALID_CREDENTIALS'
    | 'LOCKED_ACCOUNT'

/**
 * 認証失敗（API向け）
 *
 * - HttpError を継承し、errorHandler で統一的に処理される
 * - reason を code として渡すことで、レスポンス形式が { code, message } に統一される
 */
export class AuthenticationFailedError extends HttpError {
    readonly reason: AuthFailureReason

    constructor(params: { reason: AuthFailureReason; statusCode?: number }) {
        super({
            statusCode: params.statusCode ?? 401,
            code: params.reason,
            message: params.reason,
        })
        this.reason = params.reason
        this.name = 'AuthenticationFailedError'
    }
}
