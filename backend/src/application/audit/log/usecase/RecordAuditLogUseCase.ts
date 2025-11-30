// src/application/audit/log/usecase/RecordAuditLogUseCase.ts
import { AuditLogRepositoryImpl } from '@/domains/audit/log/infrastructure/repository/AuditLogRepositoryImpl.js'
import { logger } from '@/sharedTech/logger/logger.js'
import { AuditLogIntegrationEventDTO } from '../dto/AuditLogIntegrationEventDTO.js'
import { AuthLoginFailedHandler } from '../handler/AuthLoginFailedHandler.js'
import { AuthLoginSuccessHandler } from '../handler/AuthLoginSuccessHandler.js'
import { DefaultAuditIntegrationHandler } from '../handler/DefaultAuditIntegrationHandler.js'
export class RecordAuditLogUseCase {
    private readonly repo = new AuditLogRepositoryImpl()

    private readonly handlers = new Map<string, any>([
        ['auth.login.success', new AuthLoginSuccessHandler()],
        ['auth.login.failed', new AuthLoginFailedHandler()],
    ])

    async execute(rawEvent: any): Promise<void> {
        const event = AuditLogIntegrationEventDTO.fromRaw(rawEvent)

        logger.info({ eventType: event.eventType }, "[RecordAuditLogUseCase] dispatching")
        const handler =
            this.handlers.get(event.eventType) ??
            new DefaultAuditIntegrationHandler()

        const auditLog = handler.handle(event)

        await this.repo.save(auditLog)
    }
}
