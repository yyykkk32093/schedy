import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'

export type UserRegisteredAuthMethod = 'password' | 'google' | 'line' | 'apple'

export class UserRegisteredEvent
    extends BaseDomainEvent {

    readonly userId: UserId
    readonly email?: EmailAddress | null
    readonly authMethod: UserRegisteredAuthMethod

    constructor(params: {
        userId: UserId
        email?: EmailAddress | null
        authMethod: UserRegisteredAuthMethod
    }) {
        super('UserRegisteredEvent')
        this.userId = params.userId
        this.email = params.email ?? null
        this.authMethod = params.authMethod
    }
}
