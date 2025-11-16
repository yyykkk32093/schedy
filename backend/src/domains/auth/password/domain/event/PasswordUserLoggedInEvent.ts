// src/domains/auth/password/domain/event/PasswordUserLoggedInEvent.ts
import { AuthDomainEvent } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEvent.js'

/**
 * パスワード認証でログイン成功した際のイベント。
 */
export class PasswordUserLoggedInEvent extends AuthDomainEvent {
    readonly outcome = 'SUCCESS'
    readonly userId: string
    readonly email: string
    readonly ipAddress?: string
    readonly authMethod = 'password'

    constructor(params: { userId: string; email: string; ipAddress?: string }) {
        super('PasswordUserLoggedInEvent', params.userId)
        this.userId = params.userId
        this.email = params.email
        this.ipAddress = params.ipAddress
    }
}
