// integration/shared/IntegrationSource.ts
export interface IntegrationSource {
    readonly id: string
    readonly eventName: string
    readonly occurredAt: Date
}
