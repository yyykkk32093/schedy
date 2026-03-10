import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '../domain/model/valueObject/CommunityId.js'
import { CommunityName } from '../domain/model/valueObject/CommunityName.js'

export class CommunityCreatedEvent extends BaseDomainEvent {
    readonly communityId: CommunityId
    readonly name: CommunityName
    readonly createdBy: UserId

    constructor(params: {
        communityId: CommunityId
        name: CommunityName
        createdBy: UserId
    }) {
        super('CommunityCreatedEvent', params.communityId.getValue())
        this.communityId = params.communityId
        this.name = params.name
        this.createdBy = params.createdBy
    }
}
