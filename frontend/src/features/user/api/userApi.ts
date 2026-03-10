import { http } from '@/shared/lib/apiClient'
import type { UpdateUserProfileRequest, UserProfile } from '@/shared/types/api'

export const userApi = {
    /** GET /v1/users/me/profile — 自分のプロフィール取得 */
    getProfile: () =>
        http<UserProfile>('/v1/users/me/profile'),

    /** PATCH /v1/users/me — プロフィール更新 */
    updateProfile: (data: UpdateUserProfileRequest) =>
        http<void>('/v1/users/me', { method: 'PATCH', json: data }),
}
