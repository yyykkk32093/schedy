// src/application/auth/event/UserLoginFailedEvent.ts

import { ApplicationEvent } from '@/application/_sharedApplication/event/ApplicationEvent.js'
import { AuthMethod } from '@/application/auth/model/AuthMethod.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'

/**
 * ユーザーログイン失敗（Application Event）
 *
 * - 認証方式ごとの失敗（password / line / google / apple）
 * - userId は特定できない場合があるため optional
 */
export class UserLoginFailedEvent extends ApplicationEvent {
    readonly email: EmailAddress
    readonly reason: string
    readonly method: AuthMethod
    readonly userId?: UserId
    readonly ipAddress?: string

    constructor(params: {
        email: EmailAddress
        reason: string
        method: AuthMethod
        userId?: UserId
        ipAddress?: string
    }) {
        super('UserLoginFailedEvent')
        this.email = params.email
        this.reason = params.reason
        this.method = params.method
        this.userId = params.userId
        this.ipAddress = params.ipAddress
    }
}
