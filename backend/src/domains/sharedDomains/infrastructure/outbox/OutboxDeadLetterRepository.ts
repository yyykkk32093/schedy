import { IOutboxDeadLetterRepository } from "@/domains/sharedDomains/domain/integration/IOutboxDeadLetterRepository.js";
import { prisma } from "@/sharedTech/db/client.js";

export class OutboxDeadLetterRepository implements IOutboxDeadLetterRepository {

    async save(ev: any, error: unknown): Promise<void> {

        const isErr = error instanceof Error;

        await prisma.outboxDeadLetter.create({
            data: {
                outboxEventId: ev.outboxEventId,
                routingKey: ev.routingKey,
                eventType: ev.eventType,
                payload: ev.payload,
                occurredAt: ev.occurredAt,

                errorMessage: isErr ? error.message : String(error),
                errorStack: isErr ? error.stack : null,
            }
        });
    }
}
