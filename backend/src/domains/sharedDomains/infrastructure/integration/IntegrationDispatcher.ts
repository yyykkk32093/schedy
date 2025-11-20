// src/domains/sharedDomains/infrastructure/integration/dispatcher/IntegrationDispatcher.ts
import { OutboxEvent } from '../outbox/OutboxEvent.js'
import { IntegrationHandler } from './IntegrationHandler.js'

export class IntegrationDispatcher {
    private handlers = new Map<string, IntegrationHandler>()

    register(routingKey: string, handler: IntegrationHandler) {
        this.handlers.set(routingKey, handler)
    }

    async dispatch(routingKey: string, event: OutboxEvent) {
        const handler = this.handlers.get(routingKey)

        if (!handler) {
            console.warn(`[Dispatcher] No handler for routingKey=${routingKey}`)
            return
        }

        await handler.handle(event)
    }
}
