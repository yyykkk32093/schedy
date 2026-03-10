import { useSocket } from '@/app/providers/SocketProvider'
import { notificationKeys, notificationUnreadKeys } from '@/shared/lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

// ─── サーバーから配信される通知型 ─────────────────────────

interface WsNotification {
    type: string
    title: string
    body: string
    referenceId: string | null
    referenceType: string | null
}

/**
 * useSocketNotification — 通知用 WebSocket リアルタイムフック
 *
 * - notification:new リスナーで未読数キャッシュをインクリメント + 通知一覧を invalidate
 * - SocketProvider の isConnected と組み合わせてポーリングフォールバック制御
 *
 * AppLayout 等のグローバルな場所で 1回だけ呼ぶ想定。
 */
export function useSocketNotification(): void {
    const { socket } = useSocket()
    const qc = useQueryClient()

    useEffect(() => {
        if (!socket) return

        const handleNewNotification = (_payload: WsNotification) => {
            // 未読数キャッシュを楽観的にインクリメント
            qc.setQueryData<{ unreadCount: number }>(
                notificationUnreadKeys.count(),
                (old) => {
                    if (!old) return { unreadCount: 1 }
                    return { unreadCount: old.unreadCount + 1 }
                },
            )
            // 通知一覧を再取得（新着通知を表示するため）
            qc.invalidateQueries({ queryKey: notificationKeys.all })
        }

        socket.on('notification:new', handleNewNotification)
        return () => {
            socket.off('notification:new', handleNewNotification)
        }
    }, [socket, qc])
}
