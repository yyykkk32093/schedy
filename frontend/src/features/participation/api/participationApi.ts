import { http } from '@/shared/lib/apiClient'
import type { AttendScheduleRequest, AttendScheduleResponse, CreateStripePaymentIntentResponse, GetParticipationHistoryResponse, JoinWaitlistResponse, ListParticipantsResponse, ListPaymentHistoryResponse, ListRefundPendingResponse, ListWaitlistResponse } from '@/shared/types/api'

export const participationApi = {
    list: (scheduleId: string) =>
        http<ListParticipantsResponse>(`/v1/schedules/${scheduleId}/participations`),

    attend: (scheduleId: string, data: AttendScheduleRequest = {}) =>
        http<AttendScheduleResponse>(`/v1/schedules/${scheduleId}/participations`, { method: 'POST', json: data }),

    cancelAttendance: (scheduleId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/participations/me`, { method: 'DELETE' }),

    joinWaitlist: (scheduleId: string) =>
        http<JoinWaitlistResponse>(`/v1/schedules/${scheduleId}/waitlist-entries`, { method: 'POST' }),

    cancelWaitlist: (scheduleId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/waitlist-entries/me`, { method: 'DELETE' }),

    listWaitlist: (scheduleId: string) =>
        http<ListWaitlistResponse>(`/v1/schedules/${scheduleId}/waitlist-entries`),

    /** UBL-8: 支払報告 */
    reportPayment: (participationId: string) =>
        http<void>(`/v1/participations/${participationId}/report-payment`, { method: 'PATCH' }),

    /** UBL-8: 支払確認（管理者） */
    confirmPayment: (participationId: string) =>
        http<void>(`/v1/participations/${participationId}/confirm-payment`, { method: 'PATCH' }),

    /** 管理者による参加者除外 */
    removeParticipant: (scheduleId: string, userId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/participations/${userId}`, { method: 'DELETE' }),

    /** 4-4: 参加履歴（直近キャンセル情報） */
    getMyHistory: (scheduleId: string) =>
        http<GetParticipationHistoryResponse>(`/v1/schedules/${scheduleId}/participations/me/history`),

    /** 4-2: Stripe PaymentIntent 作成 */
    createStripePaymentIntent: (scheduleId: string) =>
        http<CreateStripePaymentIntentResponse>(`/v1/schedules/${scheduleId}/participations/me/stripe-payment-intent`, { method: 'POST' }),

    // ---- 返金管理 ----
    /** 返金待ち Payment 一覧（スケジュール単位） */
    listRefundPendingBySchedule: (scheduleId: string) =>
        http<ListRefundPendingResponse>(`/v1/schedules/${scheduleId}/payments/refund-pending`),

    /** 返金待ち Payment 一覧（コミュニティ単位） */
    listRefundPendingByCommunity: (communityId: string) =>
        http<ListRefundPendingResponse>(`/v1/communities/${communityId}/payments/refund-pending`),

    /** 返金履歴（コミュニティ単位：REFUNDED / NO_REFUND） */
    listPaymentHistory: (communityId: string) =>
        http<ListPaymentHistoryResponse>(`/v1/communities/${communityId}/payments/resolved`),

    /** 返金完了マーク（管理者） */
    markRefundCompleted: (paymentId: string) =>
        http<void>(`/v1/payments/${paymentId}/mark-refunded`, { method: 'PATCH' }),

    /** 返金不要マーク（管理者） */
    markNoRefund: (paymentId: string) =>
        http<void>(`/v1/payments/${paymentId}/mark-no-refund`, { method: 'PATCH' }),

    /** 返金ステータス巻き戻し（管理者）REFUNDED/NO_REFUND → REFUND_PENDING */
    revertRefundStatus: (paymentId: string) =>
        http<void>(`/v1/payments/${paymentId}/revert-refund`, { method: 'PATCH' }),
}
