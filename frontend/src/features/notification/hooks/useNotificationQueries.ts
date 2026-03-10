import { useSocket } from '@/app/providers/SocketProvider'
import { notificationApi, type NotificationCategory } from '@/features/notification/api/notificationApi'
import { notificationKeys, notificationUnreadKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** 通知一覧（カテゴリフィルタ対応） */
export function useNotifications(category?: NotificationCategory) {
    return useQuery({
        queryKey: [...notificationKeys.all, category ?? 'all'],
        queryFn: () => notificationApi.list({ category }),
    })
}

/** 未読通知数 */
export function useUnreadNotificationCount() {
    const { isConnected } = useSocket()
    return useQuery({
        queryKey: notificationUnreadKeys.count(),
        queryFn: () => notificationApi.unreadCount(),
        // WS 接続中はリアルタイム配信で補完。切断時のみポーリングフォールバック
        refetchInterval: isConnected ? false : 30_000,
    })
}

/** 既読にする */
export function useMarkNotificationAsRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: notificationKeys.all })
            qc.invalidateQueries({ queryKey: notificationUnreadKeys.count() })
        },
    })
}

/** すべて既読にする */
export function useMarkAllNotificationsAsRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: notificationKeys.all })
            qc.invalidateQueries({ queryKey: notificationUnreadKeys.count() })
        },
    })
}
