import { participationApi } from '@/features/participation/api/participationApi'
import { participationListKeys, scheduleKeys, waitlistKeys } from '@/shared/lib/queryKeys'
import type { AttendScheduleRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useParticipants(scheduleId: string) {
    return useQuery({
        queryKey: participationListKeys.bySchedule(scheduleId),
        queryFn: () => participationApi.list(scheduleId),
        enabled: !!scheduleId,
    })
}

export function useWaitlistEntries(scheduleId: string) {
    return useQuery({
        queryKey: waitlistKeys.bySchedule(scheduleId),
        queryFn: () => participationApi.listWaitlist(scheduleId),
        enabled: !!scheduleId,
    })
}

export function useAttendSchedule(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: AttendScheduleRequest) => participationApi.attend(scheduleId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
            qc.invalidateQueries({ queryKey: participationListKeys.bySchedule(scheduleId) })
        },
    })
}

export function useCancelAttendance(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => participationApi.cancelAttendance(scheduleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
            qc.invalidateQueries({ queryKey: participationListKeys.bySchedule(scheduleId) })
            qc.invalidateQueries({ queryKey: waitlistKeys.bySchedule(scheduleId) })
        },
    })
}

export function useJoinWaitlist(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => participationApi.joinWaitlist(scheduleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
            qc.invalidateQueries({ queryKey: waitlistKeys.bySchedule(scheduleId) })
        },
    })
}

export function useCancelWaitlist(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => participationApi.cancelWaitlist(scheduleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
            qc.invalidateQueries({ queryKey: waitlistKeys.bySchedule(scheduleId) })
        },
    })
}

/** UBL-8: 支払報告 */
export function useReportPayment(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (participationId: string) => participationApi.reportPayment(participationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: participationListKeys.bySchedule(scheduleId) })
        },
    })
}

/** UBL-8: 支払確認（管理者） */
export function useConfirmPayment(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (participationId: string) => participationApi.confirmPayment(participationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: participationListKeys.bySchedule(scheduleId) })
        },
    })
}

/** 管理者による参加者除外 */
export function useRemoveParticipant(scheduleId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (userId: string) => participationApi.removeParticipant(scheduleId, userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
            qc.invalidateQueries({ queryKey: participationListKeys.bySchedule(scheduleId) })
        },
    })
}
