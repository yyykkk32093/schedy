import { http } from '@/shared/lib/apiClient'
import type {
    AnnouncementDetail,
    CreateAnnouncementRequest,
    CreateAnnouncementResponse,
    CreateCommentRequest,
    CreateCommentResponse,
    ListAnnouncementsResponse,
    ListCommentsResponse,
    SearchAnnouncementsResponse,
    ToggleLikeResponse,
} from '@/shared/types/api'

export const announcementApi = {
    list: (communityId: string) =>
        http<ListAnnouncementsResponse>(`/v1/communities/${communityId}/announcements`),

    findById: (id: string) =>
        http<AnnouncementDetail>(`/v1/announcements/${id}`),

    create: (communityId: string, data: CreateAnnouncementRequest) =>
        http<CreateAnnouncementResponse>(`/v1/communities/${communityId}/announcements`, { method: 'POST', json: data }),

    remove: (id: string) =>
        http<void>(`/v1/announcements/${id}`, { method: 'DELETE' }),

    markAsRead: (id: string) =>
        http<void>(`/v1/announcements/${id}/read`, { method: 'PATCH' }),

    // ── UBL-1: いいね ──
    toggleLike: (announcementId: string) =>
        http<ToggleLikeResponse>(`/v1/announcements/${announcementId}/like`, { method: 'POST' }),

    // ── UBL-2: コメント ──
    listComments: (announcementId: string, cursor?: string) =>
        http<ListCommentsResponse>(`/v1/announcements/${announcementId}/comments`, {
            query: { cursor, limit: 20 },
        }),

    createComment: (announcementId: string, data: CreateCommentRequest) =>
        http<CreateCommentResponse>(`/v1/announcements/${announcementId}/comments`, { method: 'POST', json: data }),

    deleteComment: (commentId: string) =>
        http<void>(`/v1/announcements/comments/${commentId}`, { method: 'DELETE' }),

    // ── UBL-4: 検索 ──
    search: (keyword: string) =>
        http<SearchAnnouncementsResponse>('/v1/announcements/search', { query: { keyword } }),
}
