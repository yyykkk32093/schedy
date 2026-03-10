import { useAuth } from '@/app/providers/AuthProvider'
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'

// ─── Socket.io サーバーURL ────────────────────────────────
// 開発時: Vite proxy が /socket.io → http://localhost:3001 へ転送するため空文字（同一オリジン）
// 本番時: VITE_WS_URL で明示指定可能
const WS_URL: string = import.meta.env.VITE_WS_URL || ''

// ─── Context 型定義 ──────────────────────────────────────

interface SocketContextValue {
    /** socket.io クライアントインスタンス（未接続時は null） */
    socket: Socket | null
    /** WebSocket 接続中かどうか */
    isConnected: boolean
}

const SocketContext = createContext<SocketContextValue | null>(null)

/**
 * useSocket — Socket.io クライアントへのアクセスフック
 *
 * @example
 * const { socket, isConnected } = useSocket()
 * socket?.emit('channel:join', channelId)
 */
export function useSocket(): SocketContextValue {
    const ctx = useContext(SocketContext)
    if (!ctx) {
        throw new Error('useSocket must be used within SocketProvider')
    }
    return ctx
}

// ─── Provider ────────────────────────────────────────────

interface SocketProviderProps {
    children: ReactNode
}

/**
 * SocketProvider — Socket.io 接続管理 Provider
 *
 * - AuthProvider 内側に配置（認証済みユーザーのみ接続）
 * - httpOnly Cookie 認証（withCredentials: true）
 * - 自動再接続（socket.io デフォルト設定 + カスタムオプション）
 * - 接続状態（isConnected）を Context で公開 → ポーリングフォールバック判定に使用
 */
export function SocketProvider({ children }: SocketProviderProps) {
    const { isAuthenticated } = useAuth()
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        // 未認証時は接続しない
        if (!isAuthenticated) {
            // 既存接続があれば切断
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
                setIsConnected(false)
            }
            return
        }

        // 既に接続済みなら何もしない
        if (socketRef.current?.connected) return

        const socket = io(WS_URL, {
            // httpOnly Cookie を自動送信（JWT 認証）
            withCredentials: true,
            // 自動再接続設定
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1_000,
            reconnectionDelayMax: 30_000,
            // トランスポート: WebSocket 優先、ポーリングフォールバック
            transports: ['websocket', 'polling'],
        })

        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnected(true)
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
        })

        socket.on('connect_error', (err) => {
            console.warn('[SocketProvider] connect_error:', err.message)
            setIsConnected(false)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
            setIsConnected(false)
        }
    }, [isAuthenticated])

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                isConnected,
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}
