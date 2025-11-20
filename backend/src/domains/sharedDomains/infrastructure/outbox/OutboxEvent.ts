export class OutboxEvent {
    readonly id: string
    readonly aggregateId: string
    readonly eventName: string
    readonly eventType: string
    readonly routingKey: string

    readonly payload: Record<string, unknown>
    readonly occurredAt: Date
    readonly publishedAt?: Date | null
    readonly status: "PENDING" | "PUBLISHED" | "FAILED"

    readonly retryCount: number
    readonly maxRetries: number
    readonly retryInterval: number

    constructor(params: {
        id: string
        aggregateId: string
        eventName: string
        eventType: string
        routingKey: string
        payload: Record<string, unknown>
        occurredAt?: Date
        publishedAt?: Date | null
        status?: "PENDING" | "PUBLISHED" | "FAILED"
        retryCount?: number
        maxRetries?: number
        retryInterval?: number
    }) {
        this.id = params.id
        this.aggregateId = params.aggregateId
        this.eventName = params.eventName
        this.eventType = params.eventType
        this.routingKey = params.routingKey
        this.payload = params.payload

        this.occurredAt = params.occurredAt ?? new Date()
        this.publishedAt = params.publishedAt ?? null
        this.status = params.status ?? "PENDING"

        this.retryCount = params.retryCount ?? 0
        this.maxRetries = params.maxRetries ?? 3
        this.retryInterval = params.retryInterval ?? 5000
    }
}
