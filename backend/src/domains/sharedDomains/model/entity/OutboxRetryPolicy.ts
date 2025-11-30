export class OutboxRetryPolicy {
    readonly routingKey: string
    readonly maxRetries: number
    readonly baseInterval: number
    readonly maxInterval: number

    constructor(params: {
        routingKey: string
        maxRetries: number
        baseInterval: number
        maxInterval: number
    }) {
        this.routingKey = params.routingKey
        this.maxRetries = params.maxRetries
        this.baseInterval = params.baseInterval
        this.maxInterval = params.maxInterval
    }
}
