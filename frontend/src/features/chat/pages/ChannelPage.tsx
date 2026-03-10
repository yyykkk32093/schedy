import { useAuth } from '@/app/providers/AuthProvider'
import { ChatView } from '@/features/chat/components/ChatView'
import { useMyChannels } from '@/features/chat/hooks/useChatQueries'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

/**
 * ChannelPage — チャット画面（フルスクリーン）
 *
 * URL パラメータから channelId を取得し、チャンネル名を解決して
 * ChatView コアコンポーネントに委譲する薄いラッパー。
 */
export function ChannelPage() {
    const { channelId } = useParams<{ channelId: string }>()
    const { user } = useAuth()
    const currentUserId = user?.userId ?? ''

    // チャンネル名を useMyChannels キャッシュから解決
    const { data: channelsData } = useMyChannels()
    const channelName = useMemo(() => {
        if (!channelsData || !channelId) return 'チャット'
        const community = channelsData.community.find((c) => c.channelId === channelId)
        if (community) return community.name
        const activity = channelsData.activity.find((a) => a.channelId === channelId)
        if (activity) return activity.name
        const dm = channelsData.dm.find((d) => d.channelId === channelId)
        if (dm) return dm.participants.filter((p) => p !== currentUserId).join(', ') || 'DM'
        return 'チャット'
    }, [channelsData, channelId, currentUserId])

    if (!channelId) return null

    return (
        <div className="h-[calc(100vh-6.5rem)]">
            <ChatView
                channelId={channelId}
                showHeader={true}
                headerName={channelName}
            />
        </div>
    )
}
