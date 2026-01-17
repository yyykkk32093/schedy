// src/bootstrap/integrationDispatcherRegistrar.ts
import { IntegrationDispatcher } from '@/integration/dispatcher/IntegrationDispatcher.js'

import { HttpClient } from '@/_sharedTech/http/HttpClient.js'
import { AuditLogIntegrationHandler } from '@/integration/dispatcher/handler/AuditLogIntegrationHandler.js'
// import { NotificationHandler } from '@/domains/...'
// import { BillingHandler } from '@/domains/...'

export class IntegrationDispatcherRegistrar {
    static registerAll(dispatcher: IntegrationDispatcher) {
        const http = new HttpClient()
        const auditHandler = new AuditLogIntegrationHandler(http)

        // 互換期間: 旧routingKey（audit.log）と新routingKey（user.lifecycle.audit）を併存
        dispatcher.register('audit.log', auditHandler)
        dispatcher.register('user.lifecycle.audit', auditHandler)
        // dispatcher.register("notify.email", new NotificationHandler())
        // dispatcher.register("billing.charge", new BillingHandler())
    }
}
