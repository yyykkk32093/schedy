// src/domains/_sharedDomains/infrastructure/integration/dispatcher/IntegrationHandler.ts

import { OutboxEvent } from "@/integration/outbox/model/entity/OutboxEvent.js";

export abstract class IntegrationHandler {
    abstract handle(event: OutboxEvent): Promise<void>
}
