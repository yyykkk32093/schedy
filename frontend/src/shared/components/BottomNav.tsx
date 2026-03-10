import { useAuth } from '@/app/providers/AuthProvider'
import type { LucideIcon } from 'lucide-react'
import { Calendar, Home, MessageCircle } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

/**
 * タブ定義: icon は LucideIcon or null（null の場合は imgSrc を使用）
 */
interface NavTab {
    to: string
    label: string
    icon: LucideIcon | null
    imgSrc?: string
}

const tabs: NavTab[] = [
    { to: '/home', label: 'ホーム', icon: Home },
    { to: '/communities', label: 'コミュニティ', icon: null, imgSrc: '/icons/community-navigate.png' },
    { to: '/activities', label: 'アクティビティ', icon: Calendar },
    { to: '/chats', label: 'チャット', icon: MessageCircle },
]

/**
 * BottomNav — モバイルファーストの下部ナビゲーション（4タブ）
 *
 * ホーム / コミュニティ / アクティビティ / チャット
 */
export function BottomNav() {
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    // 未認証時・ログイン/サインアップ画面では表示しない
    if (!isAuthenticated) return null
    if (location.pathname === '/login' || location.pathname === '/signup') return null

    return (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-14">
                {tabs.map(({ to, label, icon: Icon, imgSrc }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors ${isActive
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-700'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {Icon ? (
                                    <Icon className="w-5 h-5 mb-0.5" />
                                ) : imgSrc ? (
                                    <span
                                        className="w-5 h-5 mb-0.5 inline-block"
                                        style={{
                                            backgroundColor: 'currentColor',
                                            WebkitMaskImage: `url(${imgSrc})`,
                                            WebkitMaskSize: 'contain',
                                            WebkitMaskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            maskImage: `url(${imgSrc})`,
                                            maskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                        }}
                                    />
                                ) : null}
                                <span>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
