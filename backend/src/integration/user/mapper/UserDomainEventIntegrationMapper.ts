// src/integration/user/mapper/UserDomainEventIntegrationMapper.ts

import { UserRegisteredEvent } from '@/domains/user/domain/event/UserRegisteredEvent.js'
import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import crypto from 'crypto'
import { UserRegisteredIntegrationEvent } from '../event/UserRegisteredIntegrationEvent.js'

/**
 * UserDomainEventIntegrationMapper
 *
 * - User ドメインの DomainEvent を
 *   Integration Event（OutboxEvent）へ変換する
 */
export class UserDomainEventIntegrationMapper {

    tryMap(event: IntegrationSource): OutboxEvent | null {

        switch (event.eventName) {

            case 'UserRegisteredEvent': {
                const e = event as UserRegisteredEvent

                const integration = new UserRegisteredIntegrationEvent({
                    aggregateId: e.userId.getValue(),
                    userId: e.userId.getValue(),
                    email: e.email.getValue(),
                })

                return new OutboxEvent({
                    outboxEventId: crypto.randomUUID(),
                    aggregateId: integration.aggregateId,
                    eventName: e.eventName,
                    eventType: integration.eventType,
                    routingKey: integration.routingKey,
                    payload: integration.payload,
                    occurredAt: e.occurredAt,
                    retryCount: 0,
                    nextRetryAt: new Date(),
                })
            }

            default:
                return null
        }
    }
}
