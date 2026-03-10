import { http } from '@/shared/lib/apiClient'
import type {
    ActivityDetail,
    CreateActivityRequest,
    CreateActivityResponse,
    ListActivitiesResponse,
    ListUserSchedulesResponse,
    UpdateActivityRequest,
} from '@/shared/types/api'

export const activityApi = {
    list: (communityId: string) =>
        http<ListActivitiesResponse>(`/v1/communities/${communityId}/activities`),

    findById: (id: string) =>
        http<ActivityDetail>(`/v1/activities/${id}`),

    create: (communityId: string, data: CreateActivityRequest) =>
        http<CreateActivityResponse>(`/v1/communities/${communityId}/activities`, { method: 'POST', json: data }),

    update: (id: string, data: UpdateActivityRequest) =>
        http<void>(`/v1/activities/${id}`, { method: 'PATCH', json: data }),

    remove: (id: string) =>
        http<void>(`/v1/activities/${id}`, { method: 'DELETE' }),

    /** ユーザーが所属する全コミュニティのスケジュールを日付範囲で取得 */
    listMySchedules: (from: string, to: string) =>
        http<ListUserSchedulesResponse>('/v1/users/me/schedules', { query: { from, to } }),
}
