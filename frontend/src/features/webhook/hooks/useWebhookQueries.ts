import { webhookKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { webhookApi, type UpsertWebhookRequest } from '../api/webhookApi'

/**
 * useWebhookConfigs — コミュニティの Webhook 設定一覧を取得
 */
export function useWebhookConfigs(communityId: string) {
    return useQuery({
        queryKey: webhookKeys.byCommunity(communityId),
        queryFn: () => webhookApi.list(communityId),
        enabled: !!communityId,
    })
}

/**
 * useUpsertWebhook — Webhook 設定の作成/更新
 */
export function useUpsertWebhook(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: UpsertWebhookRequest) => webhookApi.upsert(communityId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: webhookKeys.byCommunity(communityId) })
        },
    })
}

/**
 * useDeleteWebhook — Webhook 設定の削除
 */
export function useDeleteWebhook(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (configId: string) => webhookApi.remove(communityId, configId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: webhookKeys.byCommunity(communityId) })
        },
    })
}
