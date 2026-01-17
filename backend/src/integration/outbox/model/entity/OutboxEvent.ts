// src/domains/_sharedDomains/infrastructure/outbox/OutboxEvent.ts

export class OutboxEvent {
    readonly outboxEventId: string
    readonly idempotencyKey: string
    readonly aggregateId: string

    readonly eventName: string
    readonly eventType: string
    readonly routingKey: string

    readonly payload: Record<string, unknown>

    readonly occurredAt: Date
    readonly publishedAt?: Date | null
    readonly status: "PENDING" | "PUBLISHED" | "FAILED"

    readonly retryCount: number
    readonly nextRetryAt: Date

    constructor(params: {
        outboxEventId: string
        idempotencyKey: string
        aggregateId: string
        eventName: string
        eventType: string
        routingKey: string

        payload: Record<string, unknown>

        occurredAt?: Date
        publishedAt?: Date | null
        status?: "PENDING" | "PUBLISHED" | "FAILED"

        retryCount?: number
        nextRetryAt?: Date
    }) {
        this.outboxEventId = params.outboxEventId
        this.idempotencyKey = params.idempotencyKey
        this.aggregateId = params.aggregateId

        this.eventName = params.eventName
        this.eventType = params.eventType
        this.routingKey = params.routingKey

        this.payload = params.payload

        this.occurredAt = params.occurredAt ?? new Date()
        this.publishedAt = params.publishedAt ?? null
        this.status = params.status ?? "PENDING"

        this.retryCount = params.retryCount ?? 0
        this.nextRetryAt = params.nextRetryAt ?? new Date()
    }
}
