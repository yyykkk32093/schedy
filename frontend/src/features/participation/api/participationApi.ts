import { http } from '@/shared/lib/apiClient';
import type { AddVisitorRequest, AddVisitorResponse, AttendScheduleRequest, AttendScheduleResponse, CreateCreditCardPaymentIntentResponse, GetParticipationHistoryResponse, JoinWaitlistResponse, ListParticipantsResponse, ListPaymentHistoryResponse, ListRefundPendingResponse, ListWaitlistResponse, UpdateVisitorPaymentRequest, VisitorNamesResponse } from '@/shared/types/api';

export const participationApi = {
    list: (scheduleId: string) =>
        http<ListParticipantsResponse>(`/v1/schedules/${scheduleId}/participations`),

    attend: (scheduleId: string, data: AttendScheduleRequest = {}) =>
        http<AttendScheduleResponse>(`/v1/schedules/${scheduleId}/participations`, { method: 'POST', json: data }),

    cancelAttendance: (scheduleId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/participations/me`, { method: 'DELETE' }),

    joinWaitlist: (scheduleId: string) =>
        http<JoinWaitlistResponse>(`/v1/schedules/${scheduleId}/waitlist-entries`, { method: 'POST', json: {} }),

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

    /** #40: 現金支払い一括確認（管理者） */
    bulkConfirmPayment: (scheduleId: string, participationIds: string[]) =>
        http<{ results: { participationId: string; success: boolean; error?: string }[] }>(
            `/v1/schedules/${scheduleId}/payments/bulk-confirm`,
            { method: 'PATCH', json: { participationIds } },
        ),

    /** W3-09: ビジター支払い方法一括設定（管理者） */
    bulkUpdatePayment: (scheduleId: string, updates: Array<{ participationId: string; paymentMethod: string }>) =>
        http<void>(
            `/v1/schedules/${scheduleId}/payments/bulk`,
            { method: 'PATCH', json: { updates } },
        ),

    /** 管理者による参加者除外 */
    removeParticipant: (scheduleId: string, userId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/participations/${userId}`, { method: 'DELETE' }),

    /** 4-4: 参加履歴（直近キャンセル情報） */
    getMyHistory: (scheduleId: string) =>
        http<GetParticipationHistoryResponse>(`/v1/schedules/${scheduleId}/participations/me/history`),

    /** クレジットカード PaymentIntent 作成（繰り上げ参加者用） */
    createCreditCardPaymentIntent: (scheduleId: string) =>
        http<CreateCreditCardPaymentIntentResponse>(`/v1/schedules/${scheduleId}/participations/me/stripe-payment-intent`, { method: 'POST' }),

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

    // ---- ビジター管理 ----
    /** ビジター追加 */
    addVisitor: (scheduleId: string, data: AddVisitorRequest) =>
        http<AddVisitorResponse>(`/v1/schedules/${scheduleId}/guest-visitors`, { method: 'POST', json: data }),

    /** W3-13a: 登録済みビジター追加 */
    addRegisteredVisitor: (scheduleId: string, visitorUserId: string) =>
        http<{ participationId: string }>(`/v1/schedules/${scheduleId}/registered-visitors`, { method: 'POST', json: { visitorUserId } }),

    /** W3-13b: ビジター名サジェスト */
    suggestVisitorNames: (communityId: string, query?: string) =>
        http<VisitorNamesResponse>(`/v1/communities/${communityId}/visitor-names`, { query: query ? { q: query } : undefined }),

    /** ビジター支払い更新（管理者） */
    updateVisitorPayment: (participationId: string, data: UpdateVisitorPaymentRequest) =>
        http<void>(`/v1/participations/${participationId}/visitor-payment`, { method: 'PATCH', json: data }),

    /** 繰り上げ参加者の支払い方法選択 */
    selectPaymentMethod: (participationId: string, paymentMethod: string) =>
        http<void>(`/v1/participations/${participationId}/select-payment-method`, { method: 'PATCH', json: { paymentMethod } }),

    /** 参加者削除（participationId ベース・権限制御付き） */
    removeParticipation: (participationId: string) =>
        http<void>(`/v1/participations/${participationId}`, { method: 'DELETE' }),
}
