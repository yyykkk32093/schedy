import { http } from '@/shared/lib/apiClient';
import type {
    ListNotificationsResponse,
    UnreadCountResponse,
} from '@/shared/types/api';

export type NotificationCategory = 'community' | 'activity' | 'chat'

export const notificationApi = {
    /** 通知一覧（カテゴリフィルタ対応） */
    list: (options?: { cursor?: string; limit?: number; category?: NotificationCategory }) =>
        http<ListNotificationsResponse>('/v1/notifications', {
            query: {
                ...(options?.cursor ? { cursor: options.cursor } : {}),
                ...(options?.limit ? { limit: options.limit } : {}),
                ...(options?.category ? { category: options.category } : {}),
            },
        }),

    /** 未読数 */
    unreadCount: () =>
        http<UnreadCountResponse>('/v1/notifications/unread-count'),

    /** 既読にする */
    markAsRead: (notificationId: string) =>
        http<{ id: string; isRead: boolean }>(`/v1/notifications/${notificationId}/read`, { method: 'PATCH' }),

    /** すべて既読 */
    markAllAsRead: () =>
        http<{ success: boolean }>('/v1/notifications/read-all', { method: 'PATCH' }),
}
