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

export function useUpdateActivity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (input: { activityId: string; communityId: string } & Parameters<typeof activityApi.update>[1]) => {
            const { activityId, communityId, ...data } = input
            return activityApi.update(activityId, data)
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: activityListKeys.byCommunity(variables.communityId) })
            qc.invalidateQueries({ queryKey: activityKeys.detail(variables.activityId) })
        },
    })
}

export type NotifyOption = 'announcement' | 'push_only' | 'none'

export function useDeleteActivity(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ activityId, notifyOption }: { activityId: string; notifyOption: NotifyOption }) =>
            activityApi.remove(activityId, notifyOption),
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
