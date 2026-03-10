// src/bootstrap/integrationDispatcherRegistrar.ts
import { IntegrationDispatcher } from '@/integration/dispatcher/IntegrationDispatcher.js'

import { HttpClient } from '@/_sharedTech/http/HttpClient.js'
import { AuditLogIntegrationHandler } from '@/integration/dispatcher/handler/AuditLogIntegrationHandler.js'
import { LineWebhookIntegrationHandler } from '@/integration/dispatcher/handler/LineWebhookIntegrationHandler.js'
import { PushNotificationIntegrationHandler } from '@/integration/dispatcher/handler/PushNotificationIntegrationHandler.js'

export class IntegrationDispatcherRegistrar {
    static registerAll(dispatcher: IntegrationDispatcher) {
        const http = new HttpClient()
        const auditHandler = new AuditLogIntegrationHandler(http)

        // 互換期間: 旧routingKey（audit.log）と新routingKey（user.lifecycle.audit）を併存
        dispatcher.register('audit.log', auditHandler)
        dispatcher.register('user.lifecycle.audit', auditHandler)

        // プッシュ通知（FCM）
        const pushHandler = new PushNotificationIntegrationHandler()
        dispatcher.register('notification.push', pushHandler)

        // LINE Webhook（UBL-29）
        const lineWebhookHandler = new LineWebhookIntegrationHandler(http)
        dispatcher.register('webhook.line', lineWebhookHandler)
    }
}
