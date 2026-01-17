// src/application/auth/event/UserLoginSucceededEvent.ts

import { ApplicationEvent } from '@/application/_sharedApplication/event/ApplicationEvent.js'
import { AuthMethod } from '@/application/auth/model/AuthMethod.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'

/**
 * ユーザーログイン成功（Application Event）
 */
export class UserLoginSucceededEvent extends ApplicationEvent {
    readonly userId: UserId
    readonly email: EmailAddress
    readonly method: AuthMethod
    readonly ipAddress?: string

    constructor(params: {
        userId: UserId
        email: EmailAddress
        method: AuthMethod
        ipAddress?: string
    }) {
        super('UserLoginSucceededEvent')

        this.userId = params.userId
        this.email = params.email
        this.method = params.method
        this.ipAddress = params.ipAddress
    }
}
