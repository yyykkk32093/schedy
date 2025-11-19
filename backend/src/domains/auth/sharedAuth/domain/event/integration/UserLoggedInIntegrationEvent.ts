// UserLoggedInIntegrationEvent.ts
import { OutboxEvent } from '@/domains/sharedDomains/infrastructure/outbox/OutboxEvent.js'

export class UserLoggedInIntegrationEvent extends OutboxEvent {
    constructor(params: {
        userId: string
        email?: string
        authMethod: string
        ipAddress?: string
        occurredAt: Date
        routingKey: string   // ← 追加（必須）
    }) {
        super({
            id: crypto.randomUUID(),
            eventName: 'UserLoggedInIntegrationEvent',
            aggregateId: params.userId,
            routingKey: params.routingKey,    // ← 絶対必要
            payload: {
                userId: params.userId,
                email: params.email,
                authMethod: params.authMethod,
                ipAddress: params.ipAddress,
            },
            occurredAt: params.occurredAt,
            status: 'PENDING',
        })
    }
}
