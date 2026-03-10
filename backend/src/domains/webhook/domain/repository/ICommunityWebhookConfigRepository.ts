/**
 * ICommunityWebhookConfigRepository — Webhook 設定の永続化インターフェース（UBL-29）
 */
export interface WebhookConfigDto {
    id: string
    communityId: string
    service: string
    webhookUrl: string
    enabled: boolean
    createdBy: string
    createdAt: Date
    updatedAt: Date
}

export interface ICommunityWebhookConfigRepository {
    findByCommunityId(communityId: string): Promise<WebhookConfigDto[]>
    findByCommunityAndService(communityId: string, service: string): Promise<WebhookConfigDto | null>
    save(config: {
        id: string
        communityId: string
        service: string
        webhookUrl: string
        enabled: boolean
        createdBy: string
    }): Promise<void>
    update(id: string, data: { webhookUrl?: string; enabled?: boolean }): Promise<void>
    remove(id: string): Promise<void>
}
