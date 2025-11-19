// src/domains/sharedDomains/infrastructure/outbox/dispatcher/IntegrationDispatcher.ts

import { IntegrationHandler } from "./IntegrationHandler.js"

/**
 * routingKey → handler のマッピング制御
 */

export class IntegrationDispatcher {
    private handlers: Map<string, IntegrationHandler> = new Map()

    register(routingKey: string, handler: IntegrationHandler) {
        this.handlers.set(routingKey, handler)
    }

    async dispatch(routingKey: string, payload: Record<string, unknown>) {
        const handler = this.handlers.get(routingKey)
        if (!handler) {
            console.warn(`[Dispatcher] No handler for routingKey=${routingKey}`)
            return
        }

        await handler.handle(payload)
    }
}

