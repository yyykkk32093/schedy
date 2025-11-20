// src/application/audit/log/handler/AuthLoginSuccessHandler.ts
import { AuditLog } from '@/domains/audit/log/domain/model/entity/AuditLog.js'
import { IIdGenerator } from '@/domains/sharedDomains/domain/service/IIdGenerator.js'

type AuditIntegrationEvent = {
    eventType: string
    payload: any
    occurredAt: Date
}

export class AuthLoginSuccessHandler {
    handle(event: AuditIntegrationEvent, idGen: IIdGenerator): AuditLog {
        return new AuditLog(idGen, {
            eventType: event.eventType,
            userId: String(event.payload.userId),
            authMethod: String(event.payload.authMethod ?? 'password'),
            detail: null,
            occurredAt: event.occurredAt,
        })
    }
}
