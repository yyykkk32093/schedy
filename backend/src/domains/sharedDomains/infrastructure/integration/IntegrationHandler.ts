// src/domains/sharedDomains/infrastructure/integration/dispatcher/IntegrationHandler.ts

export abstract class IntegrationHandler {
    abstract handle(event: any): Promise<void>
}
