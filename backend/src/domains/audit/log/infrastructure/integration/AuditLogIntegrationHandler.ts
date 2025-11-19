import { RecordAuthAuditLogUseCase } from '@/application/audit/log/usecase/RecordAuthAuditLogUseCase.js'
import { IntegrationHandler } from '@/domains/sharedDomains/infrastructure/integration/IntegrationHandler.js'

export class AuditLogIntegrationHandler implements IntegrationHandler {
    constructor(
        private readonly recordAuthLogUseCase: RecordAuthAuditLogUseCase
    ) { }

    async handle(payload: Record<string, unknown>): Promise<void> {
        console.log('[AuditLogIntegrationHandler] Received payload:', payload)

        await this.recordAuthLogUseCase.execute({
            userId: payload.userId as string,
            email: payload.email as string | undefined,
            authMethod: payload.authMethod as string,
            ipAddress: payload.ipAddress as string | undefined,
            reason: payload.reason as string | undefined,
            occurredAt: new Date(payload.occurredAt as string),
        })
    }
}
