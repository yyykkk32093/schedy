import { dmApi } from '@/features/dm/api/dmApi'
import { dmListKeys } from '@/shared/lib/queryKeys'
import type { CreateDMRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** 自分のDMチャンネル一覧 */
export function useDMChannels() {
    return useQuery({
        queryKey: dmListKeys.myChannels(),
        queryFn: () => dmApi.list(),
    })
}

/** DM チャンネル作成 */
export function useCreateDM() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateDMRequest) => dmApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: dmListKeys.myChannels() }),
    })
}
