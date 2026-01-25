// test/e2e/eventSubscribersRegistrarForTest.ts
import { AuditLogIntegrationHandler } from '@/integration/dispatcher/handler/AuditLogIntegrationHandler.js'
import { IntegrationDispatcher } from '@/integration/dispatcher/IntegrationDispatcher.js'
import { FakeHttpClient } from './FakeHttpClient.js'

export class EventTestRegistrar {
    static registerAll(app: any) {
        const dispatcher: IntegrationDispatcher =
            app.get("integrationDispatcher")

        const auditHandler = new AuditLogIntegrationHandler(new FakeHttpClient(app))

        dispatcher.register('audit.log', auditHandler)
        dispatcher.register('user.lifecycle.audit', auditHandler)
    }
}
