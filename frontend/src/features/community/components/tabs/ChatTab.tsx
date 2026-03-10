import { ChatView } from '@/features/chat/components/ChatView'
import { useCommunityChannel } from '@/features/chat/hooks/useChatQueries'
import { MessageCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'

/**
 * ChatTab — コミュニティ詳細のチャットタブ
 *
 * コミュニティのチャンネルIDを取得し、ChatView をインライン埋め込みする。
 * BottomNav はそのまま表示される（ページ遷移しないため）。
 */
export function ChatTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const { data: channel, isLoading, isError } = useCommunityChannel(communityId!)

    if (isLoading) {
        return (
            <div className="py-8 text-center text-sm text-gray-400">読み込み中…</div>
        )
    }

    if (isError || !channel) {
        return (
            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <MessageCircle className="h-8 w-8" />
                <p className="text-sm">チャットチャンネルが見つかりません</p>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-280px)] min-h-[400px]">
            <ChatView
                channelId={channel.channelId}
                showHeader={false}
            />
        </div>
    )
}
