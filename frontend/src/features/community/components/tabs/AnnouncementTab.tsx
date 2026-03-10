import { useAnnouncements } from '@/features/announcement/hooks/useAnnouncementQueries'
import { FeedCard } from '@/features/home/components/FeedCard'
import type { AnnouncementFeedItem } from '@/shared/types/api'
import { Megaphone } from 'lucide-react'
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

    return (
        <div className="divide-y">
            {announcements.map((item) => (
                <FeedCard key={item.id} item={item as AnnouncementFeedItem} />
            ))}
        </div>
    )
}
