import { randomUUID } from 'crypto'

import type { IntegrationEvent } from '@/integration/IntegrationEvent.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'

/**
 * OutboxEventFactory
 *
 * - eventType / routingKey / payload の契約をこのFactoryに集約する
 * - UseCase / Mapper から文字列直書きを排除する
 * - 1配送先 = 1 OutboxEvent（配送単位）
 */
export class OutboxEventFactory {
    createManyFrom(input: IntegrationEvent | IntegrationEvent[]): OutboxEvent[] {
        const events = Array.isArray(input) ? input : [input]
        return events.map((event) => this.createOutboxEvent(event))
    }

    private createOutboxEvent(event: IntegrationEvent): OutboxEvent {
        return new OutboxEvent({
            outboxEventId: randomUUID(),
            idempotencyKey: event.idempotencyKey,
            aggregateId: event.aggregateId,
            eventName: event.sourceEventName,
            eventType: event.eventType,
            routingKey: event.routingKey,
            payload: event.payload,
            occurredAt: event.occurredAt,
            retryCount: 0,
            nextRetryAt: new Date(),
        })
    }
}
