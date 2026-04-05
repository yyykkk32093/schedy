/**
 * RevenueCat Web SDK 初期化・ユーティリティ
 *
 * Purchases.configure() はアプリ全体で一度だけ呼ぶ。
 * 環境変数:
 *   VITE_REVENUECAT_WEB_API_KEY  — RevenueCat の Web Billing API Key
 */

import { Purchases } from '@revenuecat/purchases-js'

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_WEB_API_KEY as string | undefined

/**
 * RevenueCat SDK が構成済みなら shared instance を返す。
 * 未構成なら configure() してから返す。
 */
export function getOrConfigurePurchases(appUserId: string): Purchases {
    if (Purchases.isConfigured()) {
        return Purchases.getSharedInstance()
    }

    if (!RC_API_KEY) {
        throw new Error(
            'VITE_REVENUECAT_WEB_API_KEY is not set. RevenueCat Web SDK cannot be initialized.',
        )
    }

    return Purchases.configure({ apiKey: RC_API_KEY, appUserId })
}

/**
 * RevenueCat SDK が設定可能かどうか
 */
export function isRevenueCatConfigured(): boolean {
    return !!RC_API_KEY
}
