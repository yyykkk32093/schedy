import { participationApi } from '@/features/participation/api/participationApi'
import { participationHistoryKeys, participationListKeys, paymentHistoryKeys, refundPendingKeys, scheduleKeys, waitlistKeys } from '@/shared/lib/queryKeys'
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
            qc.invalidateQueries({ queryKey: refundPendingKeys.bySchedule(scheduleId) })
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
            qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })
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
            qc.invalidateQueries({ queryKey: refundPendingKeys.bySchedule(scheduleId) })
        },
    })
}

/** 4-4: 参加履歴（直近キャンセル情報） */
export function useParticipationHistory(scheduleId: string, enabled = true) {
    return useQuery({
        queryKey: participationHistoryKeys.bySchedule(scheduleId),
        queryFn: () => participationApi.getMyHistory(scheduleId),
        enabled: !!scheduleId && enabled,
    })
}

/** 4-2: Stripe PaymentIntent 作成 */
export function useCreateStripePaymentIntent(scheduleId: string) {
    return useMutation({
        mutationFn: () => participationApi.createStripePaymentIntent(scheduleId),
        meta: { skipGlobalErrorHandler: false },
    })
}

// ---- 返金管理 ----

/** 返金待ち Payment 一覧（スケジュール単位） */
export function useRefundPendingBySchedule(scheduleId: string, enabled = true) {
    return useQuery({
        queryKey: refundPendingKeys.bySchedule(scheduleId),
        queryFn: () => participationApi.listRefundPendingBySchedule(scheduleId),
        enabled: !!scheduleId && enabled,
    })
}

/** 返金待ち Payment 一覧（コミュニティ単位） */
export function useRefundPendingByCommunity(communityId: string, enabled = true) {
    return useQuery({
        queryKey: refundPendingKeys.byCommunity(communityId),
        queryFn: () => participationApi.listRefundPendingByCommunity(communityId),
        enabled: !!communityId && enabled,
    })
}

/** 返金履歴（コミュニティ単位：REFUNDED / NO_REFUND） */
export function usePaymentHistory(communityId: string, enabled = true) {
    return useQuery({
        queryKey: paymentHistoryKeys.byCommunity(communityId),
        queryFn: () => participationApi.listPaymentHistory(communityId),
        enabled: !!communityId && enabled,
    })
}

/** 返金完了マーク（管理者） */
export function useMarkRefundCompleted() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (paymentId: string) => participationApi.markRefundCompleted(paymentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['refund-pending'] })
            qc.invalidateQueries({ queryKey: ['payment-history'] })
            qc.invalidateQueries({ queryKey: ['participations'] })
        },
    })
}

/** 返金不要マーク（管理者） */
export function useMarkNoRefund() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (paymentId: string) => participationApi.markNoRefund(paymentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['refund-pending'] })
            qc.invalidateQueries({ queryKey: ['payment-history'] })
            qc.invalidateQueries({ queryKey: ['participations'] })
        },
    })
}

/** 返金ステータス巻き戻し（REFUNDED/NO_REFUND → REFUND_PENDING） */
export function useRevertRefundStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (paymentId: string) => participationApi.revertRefundStatus(paymentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['refund-pending'] })
            qc.invalidateQueries({ queryKey: ['payment-history'] })
            qc.invalidateQueries({ queryKey: ['participations'] })
        },
    })
}
