import { CommunityCard } from '@/features/community/components/CommunityCard'
import { useCommunities } from '@/features/community/hooks/useCommunityQueries'
import { FloatingActionButton } from '@/shared/components/FloatingActionButton'
import { Bookmark, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * CommunityListPage — チャットリスト風コミュニティ一覧
 *
 * #52: ヘッダー右の 🔍+➕ を廃止し、FAB（split: 検索+作成）に変更
 * #53: ブックマークフィルター追加
 */
export function CommunityListPage() {
    const navigate = useNavigate()
    const { data, isLoading } = useCommunities()
    const [bookmarkOnly, setBookmarkOnly] = useState(false)

    const allCommunities = data?.communities ?? []
    const communities = bookmarkOnly ? allCommunities.filter(c => c.bookmarked) : allCommunities

    return (
        <div className="flex flex-col h-full">
            {/* Bookmark filter */}
            {allCommunities.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setBookmarkOnly(!bookmarkOnly)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${bookmarkOnly
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Bookmark size={12} className={bookmarkOnly ? 'fill-yellow-400 text-yellow-400' : ''} />
                        ブックマーク
                    </button>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
            ) : communities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6">
                    <p className="text-sm mb-4">まだコミュニティに参加していません</p>
                    <button
                        onClick={() => navigate('/communities/search')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                        コミュニティを探す
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {communities.map((c) => (
                        <CommunityCard
                            key={c.id}
                            community={c}
                            onClick={() => navigate(`/communities/${c.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* #52: FAB — 検索 + 作成 */}
            <FloatingActionButton
                variant="split"
                actions={[
                    { icon: <Search size={20} />, label: '検索', onClick: () => navigate('/communities/search') },
                    { icon: <Plus size={20} />, label: '作成', onClick: () => navigate('/communities/create') },
                ]}
            />
        </div>
    )
}
