import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { cn } from '@/shared/lib/utils'
import type { MyChannelLastMessage } from '@/shared/types/api'
import { Link } from 'react-router-dom'

interface ChannelListItemProps {
    channelId: string
    name: string
    avatarUrl?: string | null
    subtitle?: string
    lastMessage: MyChannelLastMessage | null
    className?: string
}

/**
 * チャンネル一覧の1行アイテム
 * アバター + 名前 + 最新メッセージプレビュー + 時刻
 */
export function ChannelListItem({
    channelId,
    name,
    avatarUrl,
    subtitle,
    lastMessage,
    className,
}: ChannelListItemProps) {
    const timeLabel = lastMessage ? formatRelativeTime(lastMessage.createdAt) : ''

    return (
        <Link
            to={`/chats/${channelId}`}
            className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors',
                className,
            )}
        >
            {/* アバター */}
            <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                <AvatarFallback className="text-sm font-medium bg-gray-200">
                    {name.slice(0, 2)}
                </AvatarFallback>
            </Avatar>

            {/* テキスト部分 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                        {name}
                    </span>
                    {timeLabel && (
                        <span className="text-xs text-gray-400 shrink-0">{timeLabel}</span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                )}
                {lastMessage && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                        {lastMessage.content}
                    </p>
                )}
            </div>
        </Link>
    )
}

/**
 * 相対時刻ラベル
 */
function formatRelativeTime(isoString: string): string {
    const now = Date.now()
    const then = new Date(isoString).getTime()
    const diffMs = now - then

    const minutes = Math.floor(diffMs / 60_000)
    if (minutes < 1) return '今'
    if (minutes < 60) return `${minutes}m`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`

    return new Date(isoString).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}
