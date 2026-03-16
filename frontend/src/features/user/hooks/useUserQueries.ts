import { userApi } from '@/features/user/api/userApi'
import {
    announcementFeedKeys,
    announcementListKeys,
    authKeys,
    memberKeys,
    userKeys,
} from '@/shared/lib/queryKeys'
import type { UpdateUserProfileRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** 自分のプロフィールを取得 */
export function useUserProfile() {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: () => userApi.getProfile(),
    })
}

/** プロフィール更新 mutation */
export function useUpdateUserProfile() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: UpdateUserProfileRequest) => userApi.updateProfile(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: userKeys.profile() })
            qc.invalidateQueries({ queryKey: authKeys.me() })
            // プロフィール情報 (displayName / avatarUrl) を含むキャッシュを再取得
            qc.invalidateQueries({ queryKey: announcementListKeys.all })
            qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
            qc.invalidateQueries({ queryKey: ['announcements', 'comments'] })
            qc.invalidateQueries({ queryKey: memberKeys.all })
        },
    })
}
