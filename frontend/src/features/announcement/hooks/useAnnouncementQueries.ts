import { announcementApi } from '@/features/announcement/api/announcementApi'
import { announcementFeedKeys, announcementKeys, announcementListKeys } from '@/shared/lib/queryKeys'
import type { UpdateAnnouncementRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useAnnouncements(communityId: string) {
    return useQuery({
        queryKey: announcementListKeys.byCommunity(communityId),
        queryFn: () => announcementApi.list(communityId),
        enabled: !!communityId,
    })
}

export function useAnnouncement(id: string) {
    return useQuery({
        queryKey: announcementKeys.detail(id),
        queryFn: () => announcementApi.findById(id),
        enabled: !!id,
    })
}

export function useCreateAnnouncement(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof announcementApi.create>[1]) => announcementApi.create(communityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: announcementListKeys.byCommunity(communityId) }),
    })
}

export function useUpdateAnnouncement(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequest }) =>
            announcementApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: announcementListKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        },
    })
}

export function useDeleteAnnouncement(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: announcementApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: announcementListKeys.byCommunity(communityId) }),
    })
}

export function useMarkAnnouncementAsRead(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: announcementApi.markAsRead,
        onSuccess: () => qc.invalidateQueries({ queryKey: announcementListKeys.byCommunity(communityId) }),
    })
}
