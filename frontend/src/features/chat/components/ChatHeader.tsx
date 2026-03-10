import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Search } from 'lucide-react'

interface ChatHeaderProps {
    /** 相手の名前 or チャンネル名 */
    name: string
    /** アバターURL */
    avatarUrl?: string | null
    /** サブテキスト（アクティブ状態など） */
    subtitle?: string
    /** 検索アイコンクリック時のコールバック */
    onSearchToggle?: () => void
}

/**
 * チャット画面ヘッダー — Mockup準拠
 * アバター + 名前 + アクティブ状態 + 検索アイコン
 *
 * AppLayout のヘッダー領域に useSetHeaderActions で注入するか、
 * ChannelPage 内で独立表示する。
 */
export function ChatHeader({ name, avatarUrl, subtitle, onSearchToggle }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                    <AvatarFallback className="text-sm bg-gray-200">
                        {name.slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-bold text-gray-900">{name}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400">{subtitle}</p>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onSearchToggle}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="メッセージを検索"
            >
                <Search className="h-5 w-5" />
            </button>
        </div>
    )
}
