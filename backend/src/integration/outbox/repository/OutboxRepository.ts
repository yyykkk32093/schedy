// src/domains/_sharedDomains/infrastructure/outbox/OutboxRepository.ts

import { prisma } from "@/_sharedTech/db/client.js"
import { logger } from "@/_sharedTech/logger/logger.js"
import { IOutboxRepository } from "@/integration/outbox/repository/IOutboxRepository.js"
import type { Prisma, PrismaClient } from '@prisma/client'
import { OutboxEvent } from "../model/entity/OutboxEvent.js"

export class OutboxRepository implements IOutboxRepository {

    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async save(event: OutboxEvent): Promise<void> {
        try {
            await this.db.outboxEvent.create({
                data: {
                    id: event.outboxEventId,
                    aggregateId: event.aggregateId,
                    eventName: event.eventName,
                    eventType: event.eventType,
                    routingKey: event.routingKey,
                    payload: event.payload as any,
                    occurredAt: event.occurredAt,
                    publishedAt: event.publishedAt,
                    status: event.status,
                    retryCount: event.retryCount,
                    nextRetryAt: event.nextRetryAt,
                }
            })
        } catch (err) {
            logger.error({ outboxEventId: event.outboxEventId, error: err }, "Failed to save OutboxEvent")
            throw err
        }
    }

    async saveMany(events: OutboxEvent[]): Promise<void> {
        if (events.length === 0) return

        try {
            await this.db.outboxEvent.createMany({
                data: events.map((event) => ({
                    id: event.outboxEventId,
                    aggregateId: event.aggregateId,
                    eventName: event.eventName,
                    eventType: event.eventType,
                    routingKey: event.routingKey,
                    payload: event.payload as any,
                    occurredAt: event.occurredAt,
                    publishedAt: event.publishedAt,
                    status: event.status,
                    retryCount: event.retryCount,
                    nextRetryAt: event.nextRetryAt,
                })),
            })
        } catch (err) {
            logger.error({ error: err, count: events.length }, "Failed to saveMany OutboxEvent")
            throw err
        }
    }

    async findPending(limit = 50): Promise<OutboxEvent[]> {
        try {
            const rows = await this.db.outboxEvent.findMany({
                where: {
                    status: "PENDING",
                    nextRetryAt: { lte: new Date() },
                },
                orderBy: { nextRetryAt: "asc" },
                take: limit,
            })

            logger.debug({ count: rows.length }, "Fetched pending Outbox events")

            return rows.map(r =>
                new OutboxEvent({
                    outboxEventId: r.id,
                    aggregateId: r.aggregateId,
                    eventName: r.eventName,
                    eventType: r.eventType,
                    routingKey: r.routingKey,
                    payload: r.payload as any,
                    occurredAt: r.occurredAt,
                    publishedAt: r.publishedAt,
                    status: r.status as any,
                    retryCount: r.retryCount,
                    nextRetryAt: r.nextRetryAt,
                })
            )

        } catch (err) {
            logger.error({ error: err }, "Failed to fetch pending Outbox events")
            throw err
        }
    }

    async markAsPublished(outboxEventId: string): Promise<void> {
        logger.debug({ outboxEventId: outboxEventId }, "markAsPublished called")

        try {
            await this.db.outboxEvent.update({
                where: { id: outboxEventId },
                data: {
                    status: "PUBLISHED",
                    publishedAt: new Date(),
                }
            })
        } catch (err) {
            logger.error({ outboxEventId, error: err }, "Failed to mark event as PUBLISHED")
            throw err
        }
    }

    async markAsFailed(outboxEventId: string): Promise<void> {
        try {
            await this.db.outboxEvent.update({
                where: { id: outboxEventId },
                data: {
                    status: "FAILED",
                    publishedAt: new Date(),
                }
            })
        } catch (err) {
            logger.error({ outboxEventId, error: err }, "Failed to mark event as FAILED")
            throw err
        }
    }

    async incrementRetryCount(outboxEventId: string): Promise<void> {
        try {
            await this.db.outboxEvent.update({
                where: { id: outboxEventId },
                data: { retryCount: { increment: 1 } }
            })
        } catch (err) {
            logger.error({ outboxEventId, error: err }, "Failed to increment retryCount")
            throw err
        }
    }

    async updateNextRetryAt(outboxEventId: string, nextRetryAt: Date): Promise<void> {
        try {
            await this.db.outboxEvent.update({
                where: { id: outboxEventId },
                data: { nextRetryAt }
            })
        } catch (err) {
            logger.error({ outboxEventId, nextRetryAt, error: err }, "Failed to update nextRetryAt")
            throw err
        }
    }
}
