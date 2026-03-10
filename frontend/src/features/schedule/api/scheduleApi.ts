import { http } from '@/shared/lib/apiClient'
import type {
    CreateScheduleRequest,
    CreateScheduleResponse,
    ListSchedulesResponse,
    ScheduleListItem,
    UpdateScheduleRequest,
} from '@/shared/types/api'

export const scheduleApi = {
    list: (activityId: string) =>
        http<ListSchedulesResponse>(`/v1/activities/${activityId}/schedules`),

    findById: (id: string) =>
        http<ScheduleListItem>(`/v1/schedules/${id}`),

    create: (activityId: string, data: CreateScheduleRequest) =>
        http<CreateScheduleResponse>(`/v1/activities/${activityId}/schedules`, { method: 'POST', json: data }),

    update: (id: string, data: UpdateScheduleRequest) =>
        http<void>(`/v1/schedules/${id}`, { method: 'PATCH', json: data }),

    cancel: (id: string) =>
        http<void>(`/v1/schedules/${id}/cancel`, { method: 'PATCH' }),
}
