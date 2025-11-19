// src/domains/sharedDomains/infrastructure/outbox/IntegrationHandler.ts
export interface IntegrationHandler {
    handle(payload: Record<string, unknown>): Promise<void>;
}
