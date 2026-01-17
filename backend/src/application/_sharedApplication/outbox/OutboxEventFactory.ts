import { randomUUID } from 'crypto'

import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'

import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import { UserRegisteredEvent } from '@/domains/user/domain/event/UserRegisteredEvent.js'

/**
 * OutboxEventFactory
 *
 * - eventType / routingKey / payload の契約をこのFactoryに集約する
 * - UseCase / Mapper から文字列直書きを排除する
 * - 1配送先 = 1 OutboxEvent（配送単位）
 */
export class OutboxEventFactory {
    createManyFrom(source: IntegrationSource): OutboxEvent[] {
        switch (source.eventName) {
            case 'UserRegisteredEvent':
                return this.fromUserRegistered(source as UserRegisteredEvent)
            case 'UserLoginSucceededEvent':
                return this.fromUserLoginSucceeded(source as UserLoginSucceededEvent)
            case 'UserLoginFailedEvent':
                return this.fromUserLoginFailed(source as UserLoginFailedEvent)
            default:
                return []
        }
    }

    private fromUserRegistered(event: UserRegisteredEvent): OutboxEvent[] {
        const eventType = 'user.registered'

        // 互換期間: audit.log と user.lifecycle.audit を併存
        const routingKeys = ['audit.log', 'user.lifecycle.audit'] as const

        const aggregateId = event.userId.getValue()

        const payload = {
            userId: event.userId.getValue(),
            email: event.email.getValue(),
        }

        return routingKeys.map((routingKey) =>
            this.createOutboxEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            })
        )
    }

    /**
     * 互換維持: 従来の AuthApplicationEventIntegrationMapper と同じ契約
     */
    private fromUserLoginSucceeded(event: UserLoginSucceededEvent): OutboxEvent[] {
        const eventType = 'auth.login.success'
        const routingKey = 'audit.log'

        const aggregateId = event.userId.getValue()

        const payload = {
            userId: event.userId.getValue(),
            email: event.email.getValue(),
            authMethod: event.method,
            ipAddress: event.ipAddress,
        }

        return [
            this.createOutboxEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            }),
        ]
    }

    /**
     * 互換維持: 従来の AuthApplicationEventIntegrationMapper と同じ契約
     */
    private fromUserLoginFailed(event: UserLoginFailedEvent): OutboxEvent[] {
        const eventType = 'auth.login.failed'
        const routingKey = 'audit.log'

        const aggregateId = event.userId?.getValue() ?? 'unknown'

        const payload = {
            userId: aggregateId,
            email: event.email.getValue(),
            authMethod: event.method,
            reason: event.reason,
            ipAddress: event.ipAddress,
        }

        return [
            this.createOutboxEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            }),
        ]
    }

    private createOutboxEvent(params: {
        source: IntegrationSource
        aggregateId: string
        eventType: string
        routingKey: string
        payload: Record<string, unknown>
    }): OutboxEvent {
        return new OutboxEvent({
            outboxEventId: randomUUID(),
            aggregateId: params.aggregateId,
            eventName: params.source.eventName,
            eventType: params.eventType,
            routingKey: params.routingKey,
            payload: params.payload,
            occurredAt: params.source.occurredAt,
            retryCount: 0,
            nextRetryAt: new Date(),
        })
    }
}
