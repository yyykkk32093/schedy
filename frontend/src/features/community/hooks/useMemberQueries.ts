import { memberApi } from '@/features/community/api/memberApi'
import { memberKeys } from '@/shared/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'

/** コミュニティのメンバー一覧を取得 */
export function useMembers(communityId: string) {
    return useQuery({
        queryKey: memberKeys.list(communityId),
        queryFn: () => memberApi.list(communityId),
        enabled: !!communityId,
    })
}
