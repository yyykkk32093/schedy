// src/integration/handler/AuditLogIntegrationHandler.ts

import { IntegrationHandler } from '@/domains/sharedDomains/infrastructure/integration/IntegrationHandler.js'
import { OutboxEvent } from '@/domains/sharedDomains/infrastructure/outbox/OutboxEvent.js'
import { HttpClient } from '@/sharedTech/http/HttpClient.js'

export class AuditLogIntegrationHandler extends IntegrationHandler {
    private readonly http = new HttpClient()

    private readonly endpoint = `${process.env.AUDIT_API_BASE_URL}/integration/v1/audit/logs`

    async handle(event: OutboxEvent): Promise<void> {
        console.log(`[AuditLogIntegrationHandler] POST ${this.endpoint}`)

        const dto = {
            eventType: event.eventType,
            payload: event.payload,
            occurredAt: event.occurredAt.toISOString(),
        }

        await this.http.post(this.endpoint, dto)
    }
}
