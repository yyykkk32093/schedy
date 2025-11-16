// UserLoggedInIntegrationEvent.ts
import { OutboxEvent } from '@/domains/sharedDomains/infrastructure/outbox/OutboxEvent.js'

export class UserLoggedInIntegrationEvent extends OutboxEvent {
    constructor(params: {
        userId: string
        email?: string
        authMethod: string
        ipAddress?: string
        occurredAt: Date
    }) {
        super({
            id: crypto.randomUUID(),
            eventName: 'UserLoggedInIntegrationEvent',
            aggregateId: params.userId,
            payload: {
                userId: params.userId,
                email: params.email,           // ← OK
                authMethod: params.authMethod,
                ipAddress: params.ipAddress,
            },
            occurredAt: params.occurredAt,
            status: 'PENDING',
        })
    }
}
