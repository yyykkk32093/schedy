import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import type { CommunityListItem } from '@/shared/types/api'

interface CommunityCardProps {
    community: CommunityListItem
    onClick: () => void
}

/**
 * CommunityCard — チャットリスト風のコミュニティ行コンポーネント
 *
 * [Avatar] コミュニティ名            相対時刻
 *          最新お知らせタイトル
 */
export function CommunityCard({ community, onClick }: CommunityCardProps) {
    const initial = community.name.charAt(0)
    const relativeTime = community.latestAnnouncementAt
        ? formatRelative(community.latestAnnouncementAt)
        : null

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100 last:border-b-0"
        >
            {/* Avatar */}
            <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={community.logoUrl ?? undefined} alt={community.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                    {initial}
                </AvatarFallback>
            </Avatar>

            {/* Center: name + latest announcement */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                        {community.name}
                    </span>
                    {relativeTime && (
                        <span className="text-xs text-gray-400 shrink-0">
                            {relativeTime}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                    {community.latestAnnouncementTitle ?? community.description ?? 'お知らせはまだありません'}
                </p>
            </div>
        </button>
    )
}

// ── 相対時刻ヘルパー ───────────────────────────────

function formatRelative(dateStr: string): string {
    const now = Date.now()
    const target = new Date(dateStr).getTime()
    const diffMs = now - target
    const diffMin = Math.floor(diffMs / 60_000)
    const diffHour = Math.floor(diffMs / 3_600_000)
    const diffDay = Math.floor(diffMs / 86_400_000)

    if (diffMin < 1) return '今'
    if (diffMin < 60) return `${diffMin}分前`
    if (diffHour < 24) return `${diffHour}時間前`
    if (diffDay < 7) return `${diffDay}日前`

    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
}
