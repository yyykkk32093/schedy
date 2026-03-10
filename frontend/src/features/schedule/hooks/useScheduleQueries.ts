import { scheduleApi } from '@/features/schedule/api/scheduleApi'
import { scheduleKeys, scheduleListKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useSchedules(activityId: string) {
    return useQuery({
        queryKey: scheduleListKeys.byActivity(activityId),
        queryFn: () => scheduleApi.list(activityId),
        enabled: !!activityId,
    })
}

export function useSchedule(id: string) {
    return useQuery({
        queryKey: scheduleKeys.detail(id),
        queryFn: () => scheduleApi.findById(id),
        enabled: !!id,
    })
}

export function useCreateSchedule(activityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof scheduleApi.create>[1]) => scheduleApi.create(activityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: scheduleListKeys.byActivity(activityId) }),
    })
}

export function useUpdateSchedule(id: string, activityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof scheduleApi.update>[1]) => scheduleApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleListKeys.byActivity(activityId) })
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(id) })
        },
    })
}

export function useCancelSchedule(activityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: scheduleApi.cancel,
        onSuccess: () => qc.invalidateQueries({ queryKey: scheduleListKeys.byActivity(activityId) }),
    })
}
