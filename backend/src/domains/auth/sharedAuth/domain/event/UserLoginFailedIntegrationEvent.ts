// UserLoginFailedIntegrationEvent.ts
import { OutboxEvent } from '@/domains/sharedDomains/infrastructure/outbox/OutboxEvent.js'

export class UserLoginFailedIntegrationEvent extends OutboxEvent {
    constructor(params: {
        userId: string
        email?: string
        authMethod: string
        reason: string
        ipAddress?: string
        occurredAt: Date
    }) {
        super({
            id: crypto.randomUUID(),
            eventName: 'UserLoginFailedIntegrationEvent',
            aggregateId: params.userId,
            payload: {
                userId: params.userId,
                email: params.email,           // ← ここもOK
                authMethod: params.authMethod,
                reason: params.reason,
                ipAddress: params.ipAddress,
            },
            occurredAt: params.occurredAt,
            status: 'PENDING',
        })
    }
}
