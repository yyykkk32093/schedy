import { announcementApi } from '@/features/announcement/api/announcementApi'
import {
    announcementCommentKeys,
    announcementFeedKeys,
    announcementSearchKeys,
} from '@/shared/lib/queryKeys'
import type { AnnouncementFeedItem, CreateCommentRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── UBL-1: いいねトグル ─────────────────────────────────

export function useToggleAnnouncementLike() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (announcementId: string) => announcementApi.toggleLike(announcementId),
        onMutate: async (announcementId) => {
            // Optimistic update: フィードキャッシュを即時更新
            await qc.cancelQueries({ queryKey: announcementFeedKeys.all })
            qc.setQueriesData<{ pages: Array<{ items: AnnouncementFeedItem[]; nextCursor: string | null }> }>(
                { queryKey: announcementFeedKeys.all },
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) =>
                                item.id === announcementId
                                    ? {
                                        ...item,
                                        isLiked: !item.isLiked,
                                        likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
                                    }
                                    : item,
                            ),
                        })),
                    }
                },
            )
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        },
    })
}

// ─── Phase 3 (3-1): ブックマークトグル ───────────────────

export function useToggleAnnouncementBookmark() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (announcementId: string) => announcementApi.toggleBookmark(announcementId),
        onMutate: async (announcementId) => {
            await qc.cancelQueries({ queryKey: announcementFeedKeys.all })
            qc.setQueriesData<{ pages: Array<{ items: AnnouncementFeedItem[]; nextCursor: string | null }> }>(
                { queryKey: announcementFeedKeys.all },
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) =>
                                item.id === announcementId
                                    ? { ...item, isBookmarked: !item.isBookmarked }
                                    : item,
                            ),
                        })),
                    }
                },
            )
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        },
    })
}

// ─── UBL-2: コメント ─────────────────────────────────────

export function useAnnouncementComments(announcementId: string) {
    return useQuery({
        queryKey: announcementCommentKeys.byAnnouncement(announcementId),
        queryFn: () => announcementApi.listComments(announcementId),
        enabled: !!announcementId,
    })
}

export function useCreateAnnouncementComment(announcementId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateCommentRequest) => announcementApi.createComment(announcementId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: announcementCommentKeys.byAnnouncement(announcementId) })
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        },
    })
}

export function useDeleteAnnouncementComment(announcementId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (commentId: string) => announcementApi.deleteComment(commentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: announcementCommentKeys.byAnnouncement(announcementId) })
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        },
    })
}

// ─── UBL-4: 検索 ────────────────────────────────────────

export function useSearchAnnouncements(keyword: string) {
    return useQuery({
        queryKey: announcementSearchKeys.query(keyword),
        queryFn: () => announcementApi.search(keyword),
        enabled: keyword.trim().length >= 2,
    })
}
