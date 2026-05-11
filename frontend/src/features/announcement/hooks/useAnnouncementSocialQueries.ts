import { announcementApi } from '@/features/announcement/api/announcementApi'
import {
    announcementCommentKeys,
    announcementFeedKeys,
    announcementKeys,
    announcementListKeys,
    announcementSearchKeys,
} from '@/shared/lib/queryKeys'
import type { AnnouncementFeedItem, AnnouncementListItem, CreateCommentRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── UBL-1: いいねトグル ─────────────────────────────────
//
// Phase 3 (REST 再設計): サーバー側は POST/DELETE /likes に分割されたため、
// 現状の isLiked を受け取って適切なエンドポイントを呈される。

export function useToggleAnnouncementLike() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ announcementId, isLiked }: { announcementId: string; isLiked: boolean }) =>
            isLiked
                ? announcementApi.unlike(announcementId)
                : announcementApi.like(announcementId),
        onMutate: async ({ announcementId }) => {
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
        onSettled: (_data, _error, { announcementId }) => {
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
            qc.invalidateQueries({ queryKey: announcementListKeys.all })
            // C-07: お知らせ詳細ページのキャッシュも更新
            qc.invalidateQueries({ queryKey: announcementKeys.detail(announcementId) })
            // C-05: 検索結果のキャッシュも更新
            qc.invalidateQueries({ queryKey: ['announcements', 'search'] })
        },
    })
}

// ─── Phase 3 (3-1): ブックマークトグル ─────────────────
//
// Phase 3 (REST 再設計): サーバー側は POST/DELETE /bookmarks に分割されたため、
// 現状の isBookmarked を受け取って適切なエンドポイントを呈される。

export function useToggleAnnouncementBookmark() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ announcementId, isBookmarked }: { announcementId: string; isBookmarked: boolean }) =>
            isBookmarked
                ? announcementApi.unbookmark(announcementId)
                : announcementApi.bookmark(announcementId),
        onMutate: async ({ announcementId }) => {
            // Optimistic update: フィードキャッシュ + コミュニティタブキャッシュを即時更新
            await qc.cancelQueries({ queryKey: announcementFeedKeys.all })
            await qc.cancelQueries({ queryKey: announcementListKeys.all })

            // ホームフィード（無限スクロール形式）
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

            // コミュニティお知らせタブ（フラットリスト形式）
            qc.setQueriesData<{ announcements: AnnouncementListItem[] }>(
                { queryKey: announcementListKeys.all },
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        announcements: old.announcements.map((item) =>
                            item.id === announcementId
                                ? { ...item, isBookmarked: !item.isBookmarked }
                                : item,
                        ),
                    }
                },
            )
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
            qc.invalidateQueries({ queryKey: announcementListKeys.all })
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
        mutationFn: (commentId: string) => announcementApi.deleteComment(announcementId, commentId),
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
