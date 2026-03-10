import { AuthProvider, useAuth } from '@/app/providers/AuthProvider'
import { SocketProvider } from '@/app/providers/SocketProvider'
import { useUnreadNotificationCount } from '@/features/notification/hooks/useNotificationQueries'
import { useSocketNotification } from '@/features/notification/hooks/useSocketNotification'
import { BottomNav } from '@/shared/components/BottomNav'
import {
    HeaderActionsProvider,
    useHeaderActions,
    useHeaderTitle,
} from '@/shared/components/HeaderActionsContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import type { RouteHandle } from '@/shared/types/route'
import { Bell, ChevronLeft, LogOut } from 'lucide-react'
import { Link, Outlet, useMatches, useNavigate } from 'react-router-dom'

/**
 * AppLayout — ルートレイアウトコンポーネント
 *
 * createBrowserRouter のルート定義で最上位の element として配置。
 * - AuthProvider でラップ（useNavigate が必要なため Router 内側に配置）
 * - useMatches() → handle.title / handle.showBack でヘッダーを動的制御
 * - BottomNav を最下部に固定表示
 */
export function AppLayout() {
    return (
        <AuthProvider>
            <SocketProvider>
                <HeaderActionsProvider>
                    <AppLayoutInner />
                </HeaderActionsProvider>
            </SocketProvider>
        </AuthProvider>
    )
}

function AppLayoutInner() {
    const { isAuthenticated, logout, user } = useAuth()
    const navigate = useNavigate()
    const matches = useMatches()
    const headerActions = useHeaderActions()
    const headerTitle = useHeaderTitle()

    // WebSocket 通知リスナー（グローバルで 1 回だけ起動）
    useSocketNotification()

    // 未読通知数（ヘッダーバッジ用）
    const { data: unreadData } = useUnreadNotificationCount()

    // 最も深いマッチのhandleを取得
    const currentHandle = [...matches]
        .reverse()
        .find((m) => (m.handle as RouteHandle | undefined)?.title !== undefined)
        ?.handle as RouteHandle | undefined

    // headerTitle（動的上書き）が設定されていればそちらを優先
    const title = headerTitle ?? currentHandle?.title ?? ''
    const showBack = currentHandle?.showBack ?? false

    return (
        <div className="min-h-screen pb-16 pt-12">
            {/* ── ヘッダー ── */}
            {isAuthenticated && (
                <header className="fixed top-0 inset-x-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                    {/* 左: 戻るボタン or タイトル */}
                    <div className="flex items-center gap-1 min-w-0">
                        {showBack ? (
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-0.5 text-blue-600 hover:text-blue-700 transition-colors -ml-1"
                                aria-label="戻る"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-sm">戻る</span>
                            </button>
                        ) : (
                            <span className="text-base font-bold text-gray-800 truncate">
                                {title || 'Schedy'}
                            </span>
                        )}
                    </div>

                    {/* 中央: タイトル（戻るボタン表示時） */}
                    {showBack && title && (
                        <span className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-800 truncate max-w-[50%]">
                            {title}
                        </span>
                    )}

                    {/* 右: ページ固有アクション + アバター + 通知ベル + ログアウト */}
                    <div className="flex items-center gap-3">
                        {headerActions}
                        <Link
                            to="/mypage"
                            className="flex-shrink-0"
                            aria-label="マイページ"
                        >
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? ''} />
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <Link
                            to="/notifications"
                            className="relative text-gray-500 hover:text-blue-600 transition-colors"
                            aria-label="通知"
                        >
                            <Bell className="w-5 h-5" />
                            {(unreadData?.unreadCount ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                    {unreadData!.unreadCount > 99 ? '99+' : unreadData!.unreadCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={logout}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                            aria-label="ログアウト"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">ログアウト</span>
                        </button>
                    </div>
                </header>
            )}

            <Outlet />
            <BottomNav />
        </div>
    )
}
