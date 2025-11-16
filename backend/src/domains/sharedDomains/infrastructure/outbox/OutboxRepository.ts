import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { prisma } from '@/sharedTech/db/client.js'
import { OutboxEvent } from './OutboxEvent.js'


export class OutboxRepository implements IOutboxRepository {
    async save(event: OutboxEvent): Promise<void> {
        await prisma.outboxEvent.create({
            data: {
                id: event.id,
                eventName: event.eventName,
                aggregateId: event.aggregateId,
                payload: JSON.stringify(event.payload),
                occurredAt: event.occurredAt,
                publishedAt: event.publishedAt,
                status: event.status,
            },
        })
    }

    async findPending(limit = 100): Promise<OutboxEvent[]> {
        const rows = await prisma.outboxEvent.findMany({
            where: { status: 'PENDING' },
            orderBy: { occurredAt: 'asc' },
            take: limit,
        })

        return rows.map(
            (r) =>
                new OutboxEvent({
                    id: r.id,
                    eventName: r.eventName,
                    aggregateId: r.aggregateId,
                    payload: JSON.parse(r.payload),
                    occurredAt: r.occurredAt,
                    publishedAt: r.publishedAt,
                    status: r.status as 'PENDING' | 'PUBLISHED' | 'FAILED',
                }),
        )
    }

    async markAsPublished(id: string): Promise<void> {
        await prisma.outboxEvent.update({
            where: { id },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
        })
    }

    async markAsFailed(id: string): Promise<void> {
        await prisma.outboxEvent.update({
            where: { id },
            data: { status: 'FAILED', publishedAt: new Date() },
        })
    }
}
