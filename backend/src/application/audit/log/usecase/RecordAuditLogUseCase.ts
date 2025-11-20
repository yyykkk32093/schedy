// src/application/audit/log/usecase/RecordAuditLogUseCase.ts
import { AuditLogRepositoryImpl } from '@/domains/audit/log/infrastructure/repository/AuditLogRepositoryImpl.js'
import { UuidGenerator } from '@/domains/sharedDomains/infrastructure/id/UuidGenerator.js'
import { AuditLogIntegrationEventDTO } from '../dto/AuditLogIntegrationEventDTO.js'

import { AuthLoginFailedHandler } from '../handler/AuthLoginFailedHandler.js'
import { AuthLoginSuccessHandler } from '../handler/AuthLoginSuccessHandler.js'
import { DefaultAuditIntegrationHandler } from '../handler/DefaultAuditIntegrationHandler.js'

export class RecordAuditLogUseCase {
    private readonly repo = new AuditLogRepositoryImpl()
    private readonly idGen = new UuidGenerator()

    // eventType ごとの Handler マップ
    private readonly handlers = new Map<string, any>([
        ['auth.login.success', new AuthLoginSuccessHandler()],
        ['auth.login.failed', new AuthLoginFailedHandler()],
    ])

    async execute(rawEvent: any): Promise<void> {
        const event = AuditLogIntegrationEventDTO.fromRaw(rawEvent)

        console.log('[RecordAuditLogUseCase] dispatching:', event.eventType)

        const handler =
            this.handlers.get(event.eventType) ??
            new DefaultAuditIntegrationHandler()

        const auditLog = handler.handle(event, this.idGen)

        await this.repo.save(auditLog)
    }
}
