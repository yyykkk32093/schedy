// src/integration/user/event/UserRegisteredIntegrationEvent.ts

export class UserRegisteredIntegrationEvent {
    readonly aggregateId: string

    readonly eventType = 'user.registered'
    readonly routingKey = 'audit.log'

    readonly payload: {
        userId: string
        email: string
    }

    constructor(params: {
        aggregateId: string
        userId: string
        email: string
    }) {
        this.aggregateId = params.aggregateId
        this.payload = {
            userId: params.userId,
            email: params.email,
        }
    }
}
