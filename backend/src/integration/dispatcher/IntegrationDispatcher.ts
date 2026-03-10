import { HandlerNotFoundError } from "@/integration/error/IntegrationError.js"
import { OutboxEvent } from "../outbox/model/entity/OutboxEvent.js"
import { IntegrationHandler } from "./handler/IntegrationHandler.js"

export class IntegrationDispatcher {
    private handlers = new Map<string, IntegrationHandler>()

    register(routingKey: string, handler: IntegrationHandler) {
        this.handlers.set(routingKey, handler)
    }

    async dispatch(routingKey: string, event: OutboxEvent) {
        const handler = this.handlers.get(routingKey)

        if (!handler) {
            throw new HandlerNotFoundError(routingKey)
        }

        return handler.handle(event)
    }
}
