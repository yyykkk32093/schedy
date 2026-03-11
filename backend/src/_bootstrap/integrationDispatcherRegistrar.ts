// src/bootstrap/integrationDispatcherRegistrar.ts
import { IntegrationDispatcher } from '@/integration/dispatcher/IntegrationDispatcher.js'

import { HttpClient } from '@/_sharedTech/http/HttpClient.js'
import { LineWebhookIntegrationHandler } from '@/integration/dispatcher/handler/LineWebhookIntegrationHandler.js'
import { PushNotificationIntegrationHandler } from '@/integration/dispatcher/handler/PushNotificationIntegrationHandler.js'

export class IntegrationDispatcherRegistrar {
    static registerAll(dispatcher: IntegrationDispatcher) {
        // プッシュ通知（FCM）
        const pushHandler = new PushNotificationIntegrationHandler()
        dispatcher.register('notification.push', pushHandler)

        // LINE Webhook（UBL-29）
        const http = new HttpClient()
        const lineWebhookHandler = new LineWebhookIntegrationHandler(http)
        dispatcher.register('webhook.line', lineWebhookHandler)
    }
}
