import { http } from '@/shared/lib/apiClient'
import type {
    CreateDMRequest,
    CreateDMResponse,
    ListDMChannelsResponse,
} from '@/shared/types/api'

export const dmApi = {
    /** DM チャンネル一覧 */
    list: () =>
        http<ListDMChannelsResponse>('/v1/dm/channels'),

    /** DM チャンネル作成 */
    create: (data: CreateDMRequest) =>
        http<CreateDMResponse>('/v1/dm/channels', { method: 'POST', json: data }),
}
