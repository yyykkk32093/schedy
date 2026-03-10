import { useAuth } from '@/app/providers/AuthProvider'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * 認証済みユーザーのみアクセスを許可するレイアウトルート
 *
 * createBrowserRouter のルート定義で `element: <ProtectedRoute />` として使用。
 * children ルートは `<Outlet />` で描画される。
 *
 * 未認証の場合はログイン画面にリダイレクトし、
 * リダイレクト元のパスを state に保持する（ログイン後に戻れるように）。
 */
export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    // 認証状態の確認中（ページリロード時等）
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Outlet />
}
