import { http } from '@/shared/lib/apiClient'
import type {
    CreateStampRequest,
    ListStampsResponse,
    StampItem,
} from '@/shared/types/api'

export const stampApi = {
    /** 自分のスタンプ一覧 */
    list: () =>
        http<ListStampsResponse>('/v1/stamps'),

    /** スタンプ作成 */
    create: (data: CreateStampRequest) =>
        http<StampItem>('/v1/stamps', { method: 'POST', json: data }),

    /** スタンプ削除 */
    remove: (stampId: string) =>
        http<void>(`/v1/stamps/${stampId}`, { method: 'DELETE' }),

    /** リアクション追加 */
    addReaction: (messageId: string, stampId: string) =>
        http<{ id: string }>(`/v1/messages/${messageId}/reactions`, { method: 'POST', json: { stampId } }),

    /** リアクション削除 */
    removeReaction: (messageId: string, stampId: string) =>
        http<void>(`/v1/messages/${messageId}/reactions/${stampId}`, { method: 'DELETE' }),
}
