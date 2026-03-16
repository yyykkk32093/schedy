import { stampApi } from '@/features/stamp/api/stampApi'
import { messageListKeys, stampKeys } from '@/shared/lib/queryKeys'
import type { CreateStampRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** 自分のスタンプ一覧 */
export function useStamps() {
    return useQuery({
        queryKey: stampKeys.all,
        queryFn: () => stampApi.list(),
    })
}

/** スタンプ作成 */
export function useCreateStamp() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateStampRequest) => stampApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: stampKeys.all }),
    })
}

/** スタンプ削除 */
export function useDeleteStamp() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: stampApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: stampKeys.all }),
    })
}

/** リアクション追加 */
export function useAddReaction(channelId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ messageId, stampId, emoji }: { messageId: string; stampId?: string; emoji?: string }) =>
            stampApi.addReaction(messageId, { stampId, emoji }),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: messageListKeys.byChannel(channelId) }),
    })
}

/** リアクション削除 */
export function useRemoveReaction(channelId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ messageId, identifier }: { messageId: string; identifier: string }) =>
            stampApi.removeReaction(messageId, identifier),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: messageListKeys.byChannel(channelId) }),
    })
}
