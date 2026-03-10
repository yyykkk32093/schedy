import { CommunityCard } from '@/features/community/components/CommunityCard'
import { useCommunities } from '@/features/community/hooks/useCommunityQueries'
import { useSetHeaderActions } from '@/shared/components/HeaderActionsContext'
import { Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * CommunityListPage — チャットリスト風コミュニティ一覧
 *
 * AppLayout ヘッダーに 🔍 + ➕ を注入（HeaderActionsContext 経由）
 * リスト: Avatar + コミュニティ名 + 最新お知らせ + 相対時刻
 */
export function CommunityListPage() {
    const navigate = useNavigate()
    const { data, isLoading } = useCommunities()

    const communities = data?.communities ?? []

    // ヘッダー右側に 🔍 + ➕ を注入
    const actions = useMemo(
        () => (
            <>
                <button
                    onClick={() => navigate('/communities/search')}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label="コミュニティ検索"
                >
                    <Search className="w-5 h-5" />
                </button>
                <button
                    onClick={() => navigate('/communities/create')}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label="コミュニティ作成"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </>
        ),
        [navigate],
    )
    useSetHeaderActions(actions)

    return (
        <div className="flex flex-col h-full">
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
        </div>
    )
}
