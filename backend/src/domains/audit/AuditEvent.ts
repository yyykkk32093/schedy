// sharedDomains/domain/audit/AuditEvent.ts
export interface AuditEvent {
    readonly id: string
    readonly occurredAt: Date
    readonly type: string  // e.g. "USER_LOGIN"
    readonly userId?: string
    readonly details: Record<string, any>
}
