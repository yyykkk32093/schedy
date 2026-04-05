import { http } from '@/shared/lib/apiClient';
import type { UpdateUserProfileRequest, UserProfile } from '@/shared/types/api';

/** 退会理由 */
export type WithdrawalReason = 'NOT_USING' | 'FOUND_ALTERNATIVE' | 'HARD_TO_USE' | 'FEE_TOO_HIGH' | 'OTHER'

export const userApi = {
    /** GET /v1/users/me/profile — 自分のプロフィール取得 */
    getProfile: () =>
        http<UserProfile>('/v1/users/me/profile'),

    /** PATCH /v1/users/me — プロフィール更新 */
    updateProfile: (data: UpdateUserProfileRequest) =>
        http<void>('/v1/users/me', { method: 'PATCH', json: data }),

    /** DELETE /v1/users/me — 退会（退会理由付き） */
    deleteAccount: (data?: { reason?: WithdrawalReason; freeText?: string }) =>
        http<void>('/v1/users/me', { method: 'DELETE', json: data }),
}
