// src/application/audit/log/dto/AuditLogIntegrationEventDTO.ts
export class AuditLogIntegrationEventDTO {
    readonly eventType: string
    readonly payload: Record<string, unknown>
    readonly occurredAt: Date

    constructor(props: { eventType: string; payload: any; occurredAt: Date }) {
        this.eventType = props.eventType
        this.payload = props.payload
        this.occurredAt = props.occurredAt
    }

    static fromRaw(raw: any) {
        return new AuditLogIntegrationEventDTO({
            eventType: raw.eventType,
            payload: raw.payload,
            occurredAt: new Date(raw.occurredAt),
        })
    }
}
