import { http, HttpError, type ApiError } from '@/shared/lib/apiClient'
import type {
    ChatChannel,
    ListMessagesResponse,
    MessageAttachment,
    MyChannelsResponse,
    SearchMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
} from '@/shared/types/api'

const baseURL: string = import.meta.env.VITE_API_BASE_URL || ''

export const chatApi = {
    /** 自分が参加する全チャンネル一覧 */
    getMyChannels: () => http<MyChannelsResponse>('/v1/channels'),

    /** コミュニティのチャットチャンネル取得（自動作成） */
    getCommunityChannel: (communityId: string) =>
        http<ChatChannel>(`/v1/communities/${communityId}/channel`),

    /** アクティビティのチャットチャンネル取得（自動作成） */
    getActivityChannel: (activityId: string) =>
        http<ChatChannel>(`/v1/activities/${activityId}/channel`),

    /** チャンネルのメッセージ一覧（カーソルページネーション） */
    listMessages: (channelId: string, cursor?: string, limit?: number) =>
        http<ListMessagesResponse>(`/v1/channels/${channelId}/messages`, {
            query: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) },
        }),

    /** スレッド返信一覧 */
    listReplies: (messageId: string, cursor?: string, limit?: number) =>
        http<ListMessagesResponse>(`/v1/messages/${messageId}/replies`, {
            query: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) },
        }),

    /** メッセージ検索 */
    searchMessages: (channelId: string, q: string, cursor?: string, limit?: number) =>
        http<SearchMessagesResponse>(`/v1/channels/${channelId}/messages/search`, {
            query: { q, ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) },
        }),

    /** REST でメッセージ送信（WebSocket フォールバック） */
    sendMessage: (channelId: string, data: SendMessageRequest) =>
        http<SendMessageResponse>(`/v1/channels/${channelId}/messages`, {
            method: 'POST',
            json: data,
        }),

    /** メッセージ削除 */
    deleteMessage: (messageId: string) =>
        http<void>(`/v1/messages/${messageId}`, { method: 'DELETE' }),

    /** メッセージにファイルを添付 */
    uploadAttachment: async (channelId: string, messageId: string, file: File): Promise<MessageAttachment> => {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(
            `${baseURL}/v1/channels/${channelId}/messages/${messageId}/attachments`,
            { method: 'POST', body: formData, credentials: 'include' },
        )
        const body = await res.json()
        if (!res.ok) {
            const apiError: ApiError =
                body && typeof body === 'object' && 'code' in body
                    ? (body as ApiError)
                    : { code: 'UPLOAD_ERROR', message: `Upload failed: HTTP ${res.status}` }
            throw new HttpError(res.status, apiError)
        }
        return body as MessageAttachment
    },
}
