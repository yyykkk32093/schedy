import { activityApi } from '@/features/activity/api/activityApi'
import { activityKeys, activityListKeys, scheduleListKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useActivities(communityId: string) {
    return useQuery({
        queryKey: activityListKeys.byCommunity(communityId),
        queryFn: () => activityApi.list(communityId),
        enabled: !!communityId,
    })
}

export function useActivity(id: string) {
    return useQuery({
        queryKey: activityKeys.detail(id),
        queryFn: () => activityApi.findById(id),
        enabled: !!id,
    })
}

/** ユーザーが所属する全コミュニティのスケジュールを日付範囲で取得 */
export function useUserSchedules(from: string, to: string) {
    return useQuery({
        queryKey: scheduleListKeys.byUser(from, to),
        queryFn: () => activityApi.listMySchedules(from, to),
        enabled: !!from && !!to,
    })
}

export function useCreateActivity(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof activityApi.create>[1]) => activityApi.create(communityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: activityListKeys.byCommunity(communityId) }),
    })
}

export function useUpdateActivity(id: string, communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof activityApi.update>[1]) => activityApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: activityListKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: activityKeys.detail(id) })
        },
    })
}

export function useDeleteActivity(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: activityApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: activityListKeys.byCommunity(communityId) }),
    })
}

export function useChangeOrganizer(id: string, communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: { organizerUserId?: string | null }) => activityApi.changeOrganizer(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: activityKeys.detail(id) })
            qc.invalidateQueries({ queryKey: activityListKeys.byCommunity(communityId) })
        },
    })
}
