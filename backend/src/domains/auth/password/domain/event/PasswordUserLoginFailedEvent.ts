// src/domains/auth/password/domain/event/PasswordUserLoginFailedEvent.ts
import { AuthDomainEvent } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEvent.js'

/**
 * パスワード認証でログイン失敗した際のイベント。
 */
export class PasswordUserLoginFailedEvent extends AuthDomainEvent {
    readonly outcome = 'FAILURE'
    readonly userId: string
    readonly email: string
    readonly authMethod = 'password'
    readonly reason: 'INVALID_CREDENTIALS' | 'LOCKED_ACCOUNT' | 'NOT_FOUND'
    readonly ipAddress?: string

    constructor(params: {
        userId: string
        email: string
        reason: 'INVALID_CREDENTIALS' | 'LOCKED_ACCOUNT' | 'NOT_FOUND'
        ipAddress?: string
    }) {
        super('PasswordUserLoginFailedEvent', params.userId)
        this.userId = params.userId
        this.email = params.email
        this.reason = params.reason
        this.ipAddress = params.ipAddress
    }
}
