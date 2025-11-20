// src/domains/sharedDomains/infrastructure/outbox/OutboxRepository.ts
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { prisma } from '@/sharedTech/db/client.js'
import { OutboxEvent } from './OutboxEvent.js'

export class OutboxRepository implements IOutboxRepository {

    async save(event: OutboxEvent): Promise<void> {
        await prisma.outboxEvent.create({
            data: {
                id: event.id,
                aggregateId: event.aggregateId,
                eventName: event.eventName,
                eventType: event.eventType,
                routingKey: event.routingKey,
                payload: JSON.parse(JSON.stringify(event.payload)),
                occurredAt: event.occurredAt,
                publishedAt: event.publishedAt,
                status: event.status,
                retryCount: event.retryCount,
                maxRetries: event.maxRetries,
                retryInterval: event.retryInterval,
            },
        })
    }

    async findPending(limit = 50): Promise<OutboxEvent[]> {
        const rows = await prisma.outboxEvent.findMany({
            where: { status: 'PENDING' },
            orderBy: { occurredAt: 'asc' },
            take: limit,
        })

        return rows.map(
            (r) =>
                new OutboxEvent({
                    id: r.id,
                    aggregateId: r.aggregateId,
                    eventName: r.eventName,
                    eventType: r.eventType,
                    routingKey: r.routingKey,
                    payload: JSON.parse(JSON.stringify(r.payload)),
                    occurredAt: r.occurredAt,
                    publishedAt: r.publishedAt,
                    status: r.status,
                    retryCount: r.retryCount,
                    maxRetries: r.maxRetries,
                    retryInterval: r.retryInterval,
                }),
        )
    }


    async markAsPublished(id: string): Promise<void> {
        await prisma.outboxEvent.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        })
    }

    async markAsFailed(id: string): Promise<void> {
        await prisma.outboxEvent.update({
            where: { id },
            data: {
                status: 'FAILED',
                publishedAt: new Date(),
            },
        })
    }

    async incrementRetryCount(id: string): Promise<void> {
        await prisma.outboxEvent.update({
            where: { id },
            data: {
                retryCount: { increment: 1 },
            },
        })
    }
}
