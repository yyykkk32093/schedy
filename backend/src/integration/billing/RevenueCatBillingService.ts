/**
 * RevenueCat 実装の IBillingService
 *
 * - Webhook イベントの解析
 * - RevenueCat REST API からサブスク状態取得
 * - Webhook 認証トークン検証
 *
 * @see https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import type { IBillingService, SubscriptionInfo } from './IBillingService.js'

/**
 * RevenueCat Webhook イベントの型（必要最小限）
 */
interface RevenueCatWebhookPayload {
    event: {
        type: string // INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION | NON_RENEWING_PURCHASE 等
        app_user_id: string
        product_id: string
        expiration_at_ms?: number | null
    }
}

/**
 * RevenueCat Subscriber API レスポンスの型（必要最小限）
 */
interface RevenueCatSubscriberResponse {
    subscriber: {
        entitlements: Record<string, {
            expires_date: string | null
            product_identifier: string
        }>
        non_subscriptions: Record<string, Array<{
            id: string
            purchase_date: string
        }>>
    }
}

// RevenueCat の entitlement 識別子
const ENTITLEMENT_PRO = 'pro'
// LIFETIME 商品 ID（RevenueCat の product_id と一致させる）
const LIFETIME_PRODUCT_ID = 'schedy_lifetime'

export class RevenueCatBillingService implements IBillingService {
    parseWebhookEvent(payload: unknown): SubscriptionInfo | null {
        try {
            const data = payload as RevenueCatWebhookPayload
            const event = data?.event
            if (!event || !event.app_user_id || !event.type) {
                return null
            }

            const appUserId = event.app_user_id
            const eventType = event.type

            // LIFETIME: NON_RENEWING_PURCHASE
            if (eventType === 'NON_RENEWING_PURCHASE' && event.product_id === LIFETIME_PRODUCT_ID) {
                return {
                    appUserId,
                    plan: 'LIFETIME',
                    expiresAt: null,
                    isActive: true,
                }
            }

            // サブスクリプション系イベント
            switch (eventType) {
                case 'INITIAL_PURCHASE':
                case 'RENEWAL':
                case 'PRODUCT_CHANGE':
                case 'UNCANCELLATION': {
                    const expiresAt = event.expiration_at_ms
                        ? new Date(event.expiration_at_ms)
                        : null
                    return {
                        appUserId,
                        plan: 'SUBSCRIBER',
                        expiresAt,
                        isActive: true,
                    }
                }

                case 'CANCELLATION':
                case 'EXPIRATION': {
                    return {
                        appUserId,
                        plan: 'FREE',
                        expiresAt: null,
                        isActive: false,
                    }
                }

                default:
                    logger.info(`RevenueCat: Unhandled event type: ${eventType}`)
                    return null
            }
        } catch (err) {
            logger.error(`RevenueCat: Failed to parse webhook event: ${String(err)}`)
            return null
        }
    }

    async getSubscriptionInfo(appUserId: string): Promise<SubscriptionInfo> {
        const config = AppSecretsLoader.getRevenueCat()

        const res = await fetch(
            `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
            {
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            },
        )

        if (!res.ok) {
            throw new Error(`RevenueCat API error: ${res.status} ${res.statusText}`)
        }

        const data = (await res.json()) as RevenueCatSubscriberResponse

        // LIFETIME チェック（non_subscriptions にある場合）
        const nonSubs = data.subscriber.non_subscriptions
        if (nonSubs && nonSubs[LIFETIME_PRODUCT_ID]?.length > 0) {
            return {
                appUserId,
                plan: 'LIFETIME',
                expiresAt: null,
                isActive: true,
            }
        }

        // Entitlement チェック
        const proEntitlement = data.subscriber.entitlements[ENTITLEMENT_PRO]
        if (proEntitlement) {
            const expiresAt = proEntitlement.expires_date
                ? new Date(proEntitlement.expires_date)
                : null

            // 有効期限切れか判定
            const isActive = expiresAt ? expiresAt > new Date() : true

            return {
                appUserId,
                plan: isActive ? 'SUBSCRIBER' : 'FREE',
                expiresAt,
                isActive,
            }
        }

        return {
            appUserId,
            plan: 'FREE',
            expiresAt: null,
            isActive: false,
        }
    }

    verifyWebhookAuth(authHeader: string): boolean {
        const config = AppSecretsLoader.getRevenueCat()
        // RevenueCat Webhook は Bearer トークン形式で送られる
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader
        return token === config.webhookAuthToken
    }
}
