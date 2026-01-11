// src/integration/auth/mapper/AuthIntegrationEventMapper.ts

import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import crypto from 'crypto'

import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'

import { UserLoggedInIntegrationEvent } from '../event/UserLoggedInIntegrationEvent.js'
import { UserLoginFailedIntegrationEvent } from '../event/UserLoginFailedIntegrationEvent.js'

/**
 * Auth Integration Mapper
 *
 * - IntegrationSource（意味のイベント）
 *   → OutboxEvent（配送用レコード）へ変換
 *
 * 📝 DomainEvent が追加されたら
 *   - switch(event.eventName) に case を足す
 *   - Subscriber / UseCase には触らない
 */
export class AuthApplicationEventIntegrationMapper {
    tryMap(event: IntegrationSource): OutboxEvent | null {

        switch (event.eventName) {

            case 'UserLoginSucceededEvent': {
                const e = event as UserLoginSucceededEvent

                const integration = new UserLoggedInIntegrationEvent({
                    aggregateId: e.userId.getValue(),
                    userId: e.userId.getValue(),
                    email: e.email.getValue(),
                    authMethod: e.method,
                    ipAddress: e.ipAddress,
                })

                return this.createOutboxEvent(
                    e,
                    integration.aggregateId,
                    'auth.login.success',
                    'audit.log',
                    integration.payload
                )
            }

            case 'UserLoginFailedEvent': {
                const e = event as UserLoginFailedEvent
                const aggregateId = e.userId?.getValue() ?? 'unknown'

                const integration = new UserLoginFailedIntegrationEvent({
                    aggregateId,
                    userId: aggregateId,
                    email: e.email.getValue(),
                    authMethod: e.method,
                    reason: e.reason,
                    ipAddress: e.ipAddress,
                })

                return this.createOutboxEvent(
                    e,
                    aggregateId,
                    'auth.login.failed',
                    'audit.log',
                    integration.payload
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