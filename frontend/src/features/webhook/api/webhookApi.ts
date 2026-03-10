import { http } from '@/shared/lib/apiClient'

// ─── 型定義 ──────────────────────────────────────────────

export interface WebhookConfig {
    id: string
    communityId: string
    service: string
    webhookUrl: string
    enabled: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
}

export interface UpsertWebhookRequest {
    service: string
    webhookUrl: string
    enabled: boolean
}

// ─── API 関数 ────────────────────────────────────────────

export const webhookApi = {
    list: (communityId: string) =>
        http<WebhookConfig[]>(`/v1/communities/${communityId}/webhooks`),

    upsert: (communityId: string, data: UpsertWebhookRequest) =>
        http<{ id: string }>(`/v1/communities/${communityId}/webhooks`, {
            method: 'PUT',
            json: data,
        }),

    remove: (communityId: string, configId: string) =>
        http<void>(`/v1/communities/${communityId}/webhooks/${configId}`, {
            method: 'DELETE',
        }),
}
