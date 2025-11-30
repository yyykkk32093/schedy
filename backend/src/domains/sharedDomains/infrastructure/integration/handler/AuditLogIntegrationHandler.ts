// src/integration/handlers/AuditLogIntegrationHandler.ts
import { IHttpClient } from "@/sharedTech/http/IHttpClient.js"
import { logger } from "@/sharedTech/logger/logger.js"
import { OutboxEvent } from "../../outbox/OutboxEvent.js"
import { IntegrationHandler } from "./IntegrationHandler.js"

export class AuditLogIntegrationHandler extends IntegrationHandler {
    private readonly endpoint =
        `${process.env.AUDIT_API_BASE_URL}/integration/v1/audit/logs`

    constructor(private readonly http: IHttpClient) {
        super()
    }

    async handle(event: OutboxEvent): Promise<void> {
        logger.info(
            { eventId: event.outboxEventId, endpoint: this.endpoint },
            "Sending integration event to AuditLog API"
        );

        // ★契約通り idempotencyKey を dto に入れる！
        const dto = {
            idempotencyKey: event.outboxEventId,
            eventType: event.eventType,
            payload: event.payload,
            occurredAt: event.occurredAt.toISOString(),
        };

        await this.http.post(
            this.endpoint,
            dto,
            {
                // header でも要求されるなら追加
                "Idempotency-Key": event.outboxEventId,
            }
        );
    }

}
