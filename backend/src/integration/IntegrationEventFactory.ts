import type { IntegrationSource } from '@/integration/IntegrationSource.js'

import type { IntegrationEvent } from '@/integration/IntegrationEvent.js'

/**
 * IntegrationEventFactory
 *
 * - 内部イベント（Domain/Application）から外部契約（IntegrationEvent）を生成する
 * - fan-out（routingKeyごとの複数生成）はここが担当する
 *
 * NOTE: auth/community の audit.log ルーティングは TX 内 AuditLog INSERT に移行済み。
 *       notification.push は NotificationService が直接 OutboxEvent を生成する。
 *       現在は webhook.line 等、将来の外部連携のためのプレースホルダ。
 */
export class IntegrationEventFactory {
    createManyFrom(source: IntegrationSource): IntegrationEvent[] {
        switch (source.eventName) {
            default:
                return []
        }
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
