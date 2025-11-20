// src/application/audit/log/handler/DefaultAuditIntegrationHandler.ts
import { AuditLog } from '@/domains/audit/log/domain/model/entity/AuditLog.js'
import { IIdGenerator } from '@/domains/sharedDomains/domain/service/IIdGenerator.js'

type AuditIntegrationEvent = {
    eventType: string
    payload: any
    occurredAt: Date
}

export class DefaultAuditIntegrationHandler {
    handle(event: AuditIntegrationEvent, idGen: IIdGenerator): AuditLog {
        return new AuditLog(idGen, {
            eventType: event.eventType,
            userId: String(event.payload.userId ?? 'unknown'),
            authMethod: String(event.payload.authMethod ?? 'unknown'),
            detail: JSON.stringify(event.payload),
            occurredAt: event.occurredAt,
        })
    }
}
