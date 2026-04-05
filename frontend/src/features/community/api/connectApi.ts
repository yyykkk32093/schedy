/**
 * Stripe Connect Onboarding API クライアント
 */

import { http } from '@/shared/lib/apiClient'

export interface ConnectStatusResponse {
    hasAccount: boolean
    stripeAccountId: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
}

export interface OnboardingResponse {
    accountLinkUrl: string
    stripeAccountId: string
}

export interface DashboardLinkResponse {
    dashboardUrl: string
}

export const connectApi = {
    /** Connect アカウントのステータスを取得 */
    getStatus: (communityId: string) =>
        http<ConnectStatusResponse>(`/v1/communities/${communityId}/connect/status`),

    /** オンボーディング開始（Account Link URL 取得） */
    startOnboarding: (communityId: string, refreshUrl: string, returnUrl: string) =>
        http<OnboardingResponse>(`/v1/communities/${communityId}/connect/onboarding`, {
            method: 'POST',
            json: { refreshUrl, returnUrl },
        }),

    /** Stripe Express ダッシュボードリンクを取得 */
    getDashboardLink: (communityId: string) =>
        http<DashboardLinkResponse>(`/v1/communities/${communityId}/connect/dashboard-link`, {
            method: 'POST',
        }),
}
