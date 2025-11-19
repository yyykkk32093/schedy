// domains/sharedDomains/infrastructure/outbox/OutboxEvent.ts
export class OutboxEvent {
    readonly id: string
    readonly eventName: string
    readonly aggregateId: string
    readonly payload: Record<string, unknown>
    readonly occurredAt: Date
    readonly publishedAt?: Date | null
    readonly status: 'PENDING' | 'PUBLISHED' | 'FAILED'
    readonly routingKey: string

    constructor(params: {
        id: string
        eventName: string
        aggregateId: string
        payload: Record<string, unknown>
        routingKey: string
        occurredAt?: Date
        publishedAt?: Date | null
        status?: 'PENDING' | 'PUBLISHED' | 'FAILED'
    }) {
        this.id = params.id
        this.eventName = params.eventName
        this.aggregateId = params.aggregateId
        this.payload = params.payload
        this.routingKey = params.routingKey
        this.occurredAt = params.occurredAt ?? new Date()
        this.publishedAt = params.publishedAt ?? null
        this.status = params.status ?? 'PENDING'
    }

    markPublished() {
        return new OutboxEvent({
            ...this,
            status: 'PUBLISHED',
            publishedAt: new Date(),
        })
    }

    markFailed() {
        return new OutboxEvent({
            ...this,
            status: 'FAILED',
            publishedAt: new Date(),
        })
    }
}
