import { prisma } from "@/_sharedTech/db/client.js";
import { HttpIntegrationError, IntegrationError } from "@/integration/error/IntegrationError.js";
import { OutboxEvent } from "@/integration/outbox/model/entity/OutboxEvent.js";
import { IOutboxDeadLetterRepository } from "@/integration/outbox/repository/IOutboxDeadLetterRepository.js";
import type { Prisma } from "@prisma/client";

export class OutboxDeadLetterRepository implements IOutboxDeadLetterRepository {

    async save(ev: OutboxEvent, error: IntegrationError): Promise<void> {

        await prisma.outboxDeadLetter.create({
            data: {
                outboxEventId: ev.outboxEventId,
                routingKey: ev.routingKey,
                eventType: ev.eventType,
                payload: ev.payload as Prisma.InputJsonValue,
                occurredAt: ev.occurredAt,

                errorMessage: error.message,
                errorStack: error.stack ?? null,
                errorType: error.errorType,
                retryCount: ev.retryCount,
                lastHttpStatus: error instanceof HttpIntegrationError
                    ? error.statusCode
                    : null,
            }
        });
    }
}
