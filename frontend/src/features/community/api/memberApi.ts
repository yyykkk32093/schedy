import { http } from '@/shared/lib/apiClient'
import type { ListMembersResponse } from '@/shared/types/api'

export const memberApi = {
    /** コミュニティのメンバー一覧を取得 */
    list: (communityId: string) =>
        http<ListMembersResponse>(`/v1/communities/${communityId}/members`),
}
