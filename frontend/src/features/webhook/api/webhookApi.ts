import { http } from '@/shared/lib/apiClient'
import type { ListWebhookConfigsResponse, WebhookConfig } from '@/shared/types/api'

export type { WebhookConfig }

export interface UpsertWebhookRequest {
    service: string
    webhookUrl: string
    enabled: boolean
}

// ─── API 関数 ────────────────────────────────────────────

export const webhookApi = {
    list: (communityId: string) =>
        http<ListWebhookConfigsResponse>(`/v1/communities/${communityId}/webhooks`),

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
