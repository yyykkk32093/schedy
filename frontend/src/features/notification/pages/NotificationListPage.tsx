import type { NotificationCategory } from '@/features/notification/api/notificationApi'
import {
    useMarkAllNotificationsAsRead,
    useMarkNotificationAsRead,
    useNotifications,
} from '@/features/notification/hooks/useNotificationQueries'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

const TABS: { label: string; value: NotificationCategory | undefined }[] = [
    { label: 'すべて', value: undefined },
    { label: 'コミュニティ', value: 'community' },
    { label: 'アクティビティ', value: 'activity' },
    { label: 'チャット', value: 'chat' },
]

export function NotificationListPage() {
    const [activeCategory, setActiveCategory] = useState<NotificationCategory | undefined>(undefined)
    const { data, isLoading, error } = useNotifications(activeCategory)
    const markAsRead = useMarkNotificationAsRead()
    const markAllAsRead = useMarkAllNotificationsAsRead()

    const notifications = data?.notifications ?? []

    return (
        <div className="max-w-2xl mx-auto p-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold">通知</h1>
                <button
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    type="button"
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                    すべて既読にする
                </button>
            </div>

            {/* カテゴリタブ */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
                {TABS.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        onClick={() => setActiveCategory(tab.value)}
                        className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeCategory === tab.value
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* コンテンツ */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            ) : error ? (
                <p className="text-center text-sm text-red-600 py-8">エラーが発生しました</p>
            ) : notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">通知はありません</p>
            ) : (
                <ul className="space-y-2">
                    {notifications.map((n) => (
                        <li
                            key={n.id}
                            className={`border rounded-lg p-3 ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <NotificationTypeChip type={n.type} />
                                        <p className="font-medium text-sm truncate">{n.title}</p>
                                    </div>
                                    {n.body && (
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.createdAt).toLocaleString('ja-JP')}
                                    </p>
                                </div>
                                {!n.isRead && (
                                    <button
                                        onClick={() => markAsRead.mutate(n.id)}
                                        type="button"
                                        className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2"
                                    >
                                        既読
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

/** 通知タイプの小さなチップ表示 (#55: 全通知タイプの日本語マッピング) */
function NotificationTypeChip({ type }: { type: string }) {
    const config: Record<string, { label: string; color: string }> = {
        // チャット系
        MENTION: { label: 'メンション', color: 'bg-purple-100 text-purple-700' },
        DM: { label: 'DM', color: 'bg-green-100 text-green-700' },
        REPLY: { label: '返信', color: 'bg-teal-100 text-teal-700' },
        // コミュニティ系
        ANNOUNCEMENT: { label: 'お知らせ', color: 'bg-blue-100 text-blue-700' },
        INVITE_ACCEPTED: { label: '招待承認', color: 'bg-indigo-100 text-indigo-700' },
        JOIN_REQUEST: { label: '参加申請', color: 'bg-cyan-100 text-cyan-700' },
        JOIN_APPROVED: { label: '参加承認', color: 'bg-emerald-100 text-emerald-700' },
        MEMBER_REMOVED: { label: 'メンバー除外', color: 'bg-red-100 text-red-700' },
        // アクティビティ系
        WAITLIST_PROMOTED: { label: '繰上げ', color: 'bg-yellow-100 text-yellow-700' },
        SCHEDULE_CANCELLED: { label: '開催取消', color: 'bg-red-100 text-red-700' },
        PARTICIPATION_CONFIRMED: { label: '参加確定', color: 'bg-green-100 text-green-700' },
        SCHEDULE_REMINDER: { label: 'リマインド', color: 'bg-sky-100 text-sky-700' },
        PAYMENT_REMINDER: { label: '支払い', color: 'bg-orange-100 text-orange-700' },
        PAID_CANCELLATION: { label: '返金', color: 'bg-pink-100 text-pink-700' },
        SAME_DAY_CANCELLATION: { label: '当日キャンセル', color: 'bg-rose-100 text-rose-700' },
    }
    const c = config[type] ?? { label: type, color: 'bg-gray-100 text-gray-600' }

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${c.color}`}>
            {c.label}
        </span>
    )
}
