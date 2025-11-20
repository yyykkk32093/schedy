import { OutboxEvent } from "../../infrastructure/outbox/OutboxEvent.js"

/**
 * Outbox Repository Interface
 */
export interface IOutboxRepository {
    save(event: OutboxEvent): Promise<void>

    findPending(limit?: number): Promise<OutboxEvent[]>

    markAsPublished(id: string): Promise<void>

    markAsFailed(id: string): Promise<void>

    incrementRetryCount(id: string): Promise<void>
}
