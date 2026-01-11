// src/integration/auth/mapper/AuthDomainEventIntegrationMapper.ts

import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import crypto from 'crypto'

import { UserRegisteredEvent } from '@/domains/user/domain/event/UserRegisteredEvent.js'

/**
 * AuthDomainEventIntegrationMapper
 *
 * - Auth 境界の DomainEvent（ユーザ登録など）を
 *   Integration Event（OutboxEvent）へ変換する
 */
export class AuthDomainEventIntegrationMapper {

    tryMap(event: IntegrationSource): OutboxEvent | null {

        switch (event.eventName) {

            case 'UserRegisteredEvent': {
                const e = event as UserRegisteredEvent

                const payload: Record<string, unknown> = {
                    userId: e.userId.getValue(),
                    email: e.email.getValue(),
                }

                return this.createOutboxEvent(
                    e,
                    e.userId.getValue(),
                    'auth.user.registered',
                    'audit.log',
                    payload
                )
            }

            default:
                return null
        }
    }

    private createOutboxEvent(
        source: IntegrationSource,
        aggregateId: string,
        eventType: string,
        routingKey: string,
        payload: Record<string, unknown>
    ): OutboxEvent {
        return new OutboxEvent({
            outboxEventId: crypto.randomUUID(),
            aggregateId,
            eventName: source.eventName,
            eventType,
            routingKey,
            payload,
            occurredAt: source.occurredAt,
            retryCount: 0,
            nextRetryAt: new Date(),
        })
    }
}
