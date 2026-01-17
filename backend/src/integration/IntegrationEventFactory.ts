import type { IntegrationSource } from '@/integration/IntegrationSource.js'

import type { IntegrationEvent } from '@/integration/IntegrationEvent.js'

import type { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import type { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import type { UserRegisteredEvent } from '@/domains/user/domain/event/UserRegisteredEvent.js'

/**
 * IntegrationEventFactory
 *
 * - 内部イベント（Domain/Application）から外部契約（IntegrationEvent）を生成する
 * - fan-out（routingKeyごとの複数生成）はここが担当する
 */
export class IntegrationEventFactory {
    createManyFrom(source: IntegrationSource): IntegrationEvent[] {
        switch (source.eventName) {
            case 'UserRegisteredEvent':
                return this.fromUserRegistered(source as unknown as UserRegisteredEvent)
            case 'UserLoginSucceededEvent':
                return this.fromUserLoginSucceeded(source as unknown as UserLoginSucceededEvent)
            case 'UserLoginFailedEvent':
                return this.fromUserLoginFailed(source as unknown as UserLoginFailedEvent)
            default:
                return []
        }
    }

    private fromUserRegistered(event: UserRegisteredEvent): IntegrationEvent[] {
        const eventType = 'user.registered'

        // 併存はUserRegisteredのみ
        const routingKeys = ['audit.log', 'user.lifecycle.audit'] as const

        const aggregateId = event.userId.getValue()

        const payload = {
            userId: event.userId.getValue(),
            email: event.email.getValue(),
        }

        return routingKeys.map((routingKey) =>
            this.createIntegrationEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            })
        )
    }

    private fromUserLoginSucceeded(event: UserLoginSucceededEvent): IntegrationEvent[] {
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
            this.createIntegrationEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            }),
        ]
    }

    private fromUserLoginFailed(event: UserLoginFailedEvent): IntegrationEvent[] {
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
            this.createIntegrationEvent({
                source: event,
                aggregateId,
                eventType,
                routingKey,
                payload,
            }),
        ]
    }

    private createIntegrationEvent(params: {
        source: IntegrationSource
        aggregateId: string
        eventType: string
        routingKey: string
        payload: Record<string, unknown>
    }): IntegrationEvent {
        const idempotencyKey = `${params.source.id}:${params.routingKey}:${params.eventType}`

        return {
            sourceEventId: params.source.id,
            sourceEventName: params.source.eventName,
            occurredAt: params.source.occurredAt,
            aggregateId: params.aggregateId,
            eventType: params.eventType,
            routingKey: params.routingKey,
            payload: params.payload,
            idempotencyKey,
        }
    }
}
