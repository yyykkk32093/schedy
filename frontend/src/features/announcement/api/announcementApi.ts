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
    ToggleBookmarkResponse,
    ToggleLikeResponse,
    UpdateAnnouncementRequest,
    UpdateAnnouncementResponse,
} from '@/shared/types/api'

export const announcementApi = {
    list: (communityId: string, params?: { activityFilter?: boolean }) =>
        http<ListAnnouncementsResponse>(`/v1/communities/${communityId}/announcements`, {
            query: params?.activityFilter ? { activityFilter: 'true' } : undefined,
        }),

    findById: (id: string) =>
        http<AnnouncementDetail>(`/v1/announcements/${id}`),

    create: (communityId: string, data: CreateAnnouncementRequest) =>
        http<CreateAnnouncementResponse>(`/v1/communities/${communityId}/announcements`, { method: 'POST', json: data }),

    update: (id: string, data: UpdateAnnouncementRequest) =>
        http<UpdateAnnouncementResponse>(`/v1/announcements/${id}`, { method: 'PATCH', json: data }),

    remove: (id: string) =>
        http<void>(`/v1/announcements/${id}`, { method: 'DELETE' }),

    markAsRead: (id: string) =>
        http<void>(`/v1/announcements/${id}/reads`, { method: 'POST' }),

    // ── UBL-1: いいね (Phase 3 REST 再設計でリソース化: /likes) ──
    like: (announcementId: string) =>
        http<ToggleLikeResponse>(`/v1/announcements/${announcementId}/likes`, { method: 'POST' }),

    unlike: (announcementId: string) =>
        http<ToggleLikeResponse>(`/v1/announcements/${announcementId}/likes`, { method: 'DELETE' }),

    // ── Phase 3 (3-1): ブックマーク (Phase 3 REST 再設計でリソース化: /bookmarks) ──
    bookmark: (announcementId: string) =>
        http<ToggleBookmarkResponse>(`/v1/announcements/${announcementId}/bookmarks`, { method: 'POST' }),

    unbookmark: (announcementId: string) =>
        http<ToggleBookmarkResponse>(`/v1/announcements/${announcementId}/bookmarks`, { method: 'DELETE' }),

    // ── UBL-2: コメント ──
    listComments: (announcementId: string, cursor?: string) =>
        http<ListCommentsResponse>(`/v1/announcements/${announcementId}/comments`, {
            query: { cursor, limit: 20 },
        }),

    createComment: (announcementId: string, data: CreateCommentRequest) =>
        http<CreateCommentResponse>(`/v1/announcements/${announcementId}/comments`, { method: 'POST', json: data }),

    deleteComment: (announcementId: string, commentId: string) =>
        http<void>(`/v1/announcements/${announcementId}/comments/${commentId}`, { method: 'DELETE' }),

    // ── UBL-4: 検索 ──
    search: (keyword: string) =>
        http<SearchAnnouncementsResponse>('/v1/announcements/search', { query: { q: keyword } }),
}
