import { CommunityProfileHeader } from '@/features/community/components/CommunityProfileHeader'
import { ActivitiesTab } from '@/features/community/components/detail/tabs/ActivitiesTab'
import { AlbumTab, AnnouncementTab, ChatTab } from '@/features/community/components/tabs'
import { useCommunity } from '@/features/community/hooks/useCommunityQueries'
import { useSetHeaderTitle } from '@/shared/components/HeaderActionsContext'
import { SectionTabs } from '@/shared/components/SectionTabs'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * CommunityDetailPage — コミュニティ詳細画面
 *
 * プロフィールヘッダー + 4タブ（お知らせ / アクティビティ / チャット / アルバム）
 * + FAB（タブに応じた作成ボタン）
 * 統計・設定は CommunityProfileHeader 内にボタンとして配置（OWNER/ADMIN のみ）
 */
export function CommunityDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: community, isLoading } = useCommunity(id!)
    const [activeTab, setActiveTab] = useState('announcements')

    // 2-4: ヘッダータイトルをコミュニティ名に動的変更
    useSetHeaderTitle(community?.name)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!community) {
        return <div className="p-6 text-center text-red-500">コミュニティが見つかりません</div>
    }

    const tabs = [
        { value: 'announcements', label: 'お知らせ', content: <AnnouncementTab /> },
        { value: 'activities', label: 'アクティビティ', content: <ActivitiesTab /> },
        { value: 'chat', label: 'チャット', content: <ChatTab /> },
        { value: 'album', label: 'アルバム', content: <AlbumTab /> },
    ]

    // 2-10: FAB — タブ固有の1ボタン即遷移
    const fabAction = getFabAction(activeTab, id!)

    return (
        <div className="pb-4">
            {/* 2-2, 2-3: 統計・設定ボタンは CommunityProfileHeader 内に配置 */}
            <CommunityProfileHeader community={community} />

            <div className="mt-2 px-4">
                <SectionTabs
                    tabs={tabs}
                    defaultValue="announcements"
                    onValueChange={(v) => setActiveTab(v)}
                />
            </div>

            {/* 2-9, 2-10: FAB — タブ固有アイコンの1ボタン即遷移 */}
            {fabAction && (
                <button
                    className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg hover:opacity-80 active:scale-95 transition-all"
                    onClick={() => navigate(fabAction.path)}
                    aria-label={fabAction.label}
                >
                    <img
                        src={fabAction.icon}
                        alt={fabAction.label}
                        className="w-full h-full rounded-full"
                    />
                </button>
            )}
        </div>
    )
}

/**
 * アクティブタブに応じた FAB 情報を返す（null = 非表示）
 */
function getFabAction(activeTab: string, communityId: string): { label: string; icon: string; path: string } | null {
    switch (activeTab) {
        case 'announcements':
            return { label: 'お知らせ作成', icon: '/icons/announcement-create.png', path: `/communities/${communityId}/announcements/new` }
        case 'activities':
            return { label: 'アクティビティ作成', icon: '/icons/activity-create.png', path: `/communities/${communityId}/activities/new` }
        case 'album':
            return { label: 'アルバム作成', icon: '/icons/album-create.png', path: `/communities/${communityId}/albums/new` }
        default:
            return null // チャットタブ等では FAB 非表示
    }
}
