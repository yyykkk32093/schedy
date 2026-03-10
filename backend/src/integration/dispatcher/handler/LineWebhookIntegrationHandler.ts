import { prisma } from '@/_sharedTech/db/client.js'
import { IHttpClient } from '@/_sharedTech/http/IHttpClient.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import { IntegrationHandler } from './IntegrationHandler.js'

/**
 * LineWebhookIntegrationHandler
 *
 * OutboxWorker から routingKey = 'webhook.line' で dispatch されるハンドラ。
 * CommunityWebhookConfig から LINE webhook URL を取得し、メッセージを POST する。
 *
 * payload に communityId を含む前提。
 * webhook が無効（enabled=false）または未設定の場合は skip する。
 */
export class LineWebhookIntegrationHandler extends IntegrationHandler {

    constructor(private readonly http: IHttpClient) {
        super()
    }

    async handle(event: OutboxEvent): Promise<void> {
        const payload = event.payload as {
            communityId: string
            type: string       // 'ANNOUNCEMENT' | 'POLL'
            title: string
            body: string | null
        }

        const { communityId, type, title, body } = payload

        // CommunityWebhookConfig から LINE 設定を取得
        const config = await prisma.communityWebhookConfig.findUnique({
            where: {
                communityId_service: {
                    communityId,
                    service: 'LINE',
                },
            },
        })

        if (!config || !config.enabled) {
            logger.info(
                { eventId: event.outboxEventId, communityId },
                '[LINE Webhook] No active LINE config — skipping',
            )
            return
        }

        // LINE Notify / LINE Messaging API Webhook 形式でメッセージ送信
        const emoji = type === 'ANNOUNCEMENT' ? '📢' : '🗳️'
        const label = type === 'ANNOUNCEMENT' ? 'お知らせ' : '投票'
        const message = [
            `${emoji} ${label}が投稿されました`,
            ``,
            `📌 ${title}`,
            body ? `${body}` : null,
        ]
            .filter(Boolean)
            .join('\n')

        logger.info(
            { eventId: event.outboxEventId, communityId, webhookUrl: config.webhookUrl },
            '[LINE Webhook] Sending message',
        )

        await this.http.post(
            config.webhookUrl,
            { message },
            {},
        )
    }
}
