// src/bootstrap/integrationDispatcherRegistrar.ts
import { IntegrationDispatcher } from '@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js'

import { AuditLogIntegrationHandler } from '@/domains/sharedDomains/infrastructure/integration/handler/AuditLogIntegrationHandler.js'
import { HttpClient } from '@/sharedTech/http/HttpClient.js'
// import { NotificationHandler } from '@/domains/...'
// import { BillingHandler } from '@/domains/...'

export class IntegrationDispatcherRegistrar {
    static registerAll(dispatcher: IntegrationDispatcher) {
        dispatcher.register("audit.log", new AuditLogIntegrationHandler(new HttpClient()))
        // dispatcher.register("notify.email", new NotificationHandler())
        // dispatcher.register("billing.charge", new BillingHandler())
    }
}
