import { useAnnouncements } from '@/features/announcement/hooks/useAnnouncementQueries'
import { FeedCard } from '@/features/home/components/FeedCard'
import type { AnnouncementFeedItem } from '@/shared/types/api'
import { Bookmark, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

/**
 * AnnouncementTab — コミュニティ詳細のお知らせタブ
 *
 * BE の ListAnnouncements API がリッチデータ（著者名、いいね、コメント数等）を
 * 返すようになったため、FeedCard をそのまま利用してインライン表示する。
 */
export function AnnouncementTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const { data, isLoading } = useAnnouncements(communityId!)
    const [bookmarkOnly, setBookmarkOnly] = useState(false)

    if (isLoading) {
        return (
            <div className="py-8 text-center text-sm text-gray-400">読み込み中…</div>
        )
    }

    const announcements = data?.announcements ?? []

    if (announcements.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <Megaphone className="h-8 w-8" />
                <p className="text-sm">まだお知らせはありません</p>
            </div>
        )
    }

    const displayItems = bookmarkOnly
        ? announcements.filter((item) => item.isBookmarked)
        : announcements

    return (
        <div>
            {/* ブックマークフィルタ */}
            <div className="flex items-center gap-2 px-4 py-2">
                <button
                    type="button"
                    onClick={() => setBookmarkOnly(!bookmarkOnly)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${bookmarkOnly
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                >
                    <Bookmark className={`h-3.5 w-3.5 ${bookmarkOnly ? 'fill-yellow-500' : ''}`} />
                    お気に入り
                </button>
            </div>

            {displayItems.length === 0 && bookmarkOnly ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Bookmark className="mb-2 h-8 w-8" />
                    <p className="text-sm">ブックマークしたお知らせはありません</p>
                </div>
            ) : (
                <div className="divide-y">
                    {displayItems.map((item) => (
                        <FeedCard key={item.id} item={item as AnnouncementFeedItem} />
                    ))}
                </div>
            )}
        </div>
    )
}
