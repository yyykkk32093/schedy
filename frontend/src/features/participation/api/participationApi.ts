import { http } from '@/shared/lib/apiClient'
import type { AttendScheduleRequest, AttendScheduleResponse, JoinWaitlistResponse, ListParticipantsResponse, ListWaitlistResponse } from '@/shared/types/api'

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
}
