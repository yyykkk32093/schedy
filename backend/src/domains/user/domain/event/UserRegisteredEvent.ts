import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { IntegrationSource } from '@/integration/IntegrationSource.js'

export class UserRegisteredEvent
    extends BaseDomainEvent
    implements IntegrationSource {

    readonly userId: UserId
    readonly email: EmailAddress

    constructor(params: {
        userId: UserId
        email: EmailAddress
    }) {
        super('UserRegisteredEvent')
        this.userId = params.userId
        this.email = params.email
    }
}
