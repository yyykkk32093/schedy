import { ChannelListItem } from '@/features/chat/components/ChannelListItem'
import { ChannelSection } from '@/features/chat/components/ChannelSection'
import { ChatSearchBar } from '@/features/chat/components/ChatSearchBar'
import { useMyChannels } from '@/features/chat/hooks/useChatQueries'
import { Loader2, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

/**
 * ChatListPage — チャット一覧画面
 *
 * BottomNav「チャット」タブのランディング。
 * Community / Activity / DirectMessage の3セクション（アコーディオン）で
 * チャンネル一覧＋最新メッセージプレビューを表示する。
 */
export function ChatListPage() {
    const { data, isLoading, error } = useMyChannels()
    const [search, setSearch] = useState('')

    // ローカルフィルタリング
    const filtered = useMemo(() => {
        if (!data) return null
        const q = search.toLowerCase().trim()
        if (!q) return data
        return {
            community: data.community.filter(
                (ch) =>
                    ch.name.toLowerCase().includes(q) ||
                    ch.lastMessage?.content.toLowerCase().includes(q),
            ),
            activity: data.activity.filter(
                (ch) =>
                    ch.name.toLowerCase().includes(q) ||
                    ch.subtitle.toLowerCase().includes(q) ||
                    ch.lastMessage?.content.toLowerCase().includes(q),
            ),
            dm: data.dm.filter(
                (ch) =>
                    ch.participants.some((p) => p.toLowerCase().includes(q)) ||
                    ch.lastMessage?.content.toLowerCase().includes(q),
            ),
        }
    }, [data, search])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <MessageCircle className="w-10 h-10 mb-2" />
                <p className="text-sm text-red-500">読み込みに失敗しました</p>
            </div>
        )
    }

    const { community = [], activity = [], dm = [] } = filtered ?? {}
    const isEmpty = community.length === 0 && activity.length === 0 && dm.length === 0

    return (
        <div className="flex flex-col min-h-full">
            {/* 検索バー */}
            <ChatSearchBar value={search} onChange={setSearch} />

            {isEmpty && !search ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <MessageCircle className="w-10 h-10 mb-2" />
                    <p className="text-sm">チャットはまだありません</p>
                </div>
            ) : isEmpty && search ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="text-sm">「{search}」に一致するチャットはありません</p>
                </div>
            ) : (
                <div className="flex-1">
                    {/* Community セクション */}
                    {community.length > 0 && (
                        <ChannelSection title="Community" defaultOpen count={community.length}>
                            {community.map((ch) => (
                                <ChannelListItem
                                    key={ch.channelId}
                                    channelId={ch.channelId}
                                    name={ch.name}
                                    avatarUrl={ch.avatarUrl}
                                    lastMessage={ch.lastMessage}
                                />
                            ))}
                        </ChannelSection>
                    )}

                    {/* Activity セクション */}
                    {activity.length > 0 && (
                        <ChannelSection title="Activity" defaultOpen count={activity.length}>
                            {activity.map((ch) => (
                                <ChannelListItem
                                    key={ch.channelId}
                                    channelId={ch.channelId}
                                    name={ch.name}
                                    subtitle={ch.subtitle}
                                    lastMessage={ch.lastMessage}
                                />
                            ))}
                        </ChannelSection>
                    )}

                    {/* DirectMessage セクション */}
                    {dm.length > 0 && (
                        <ChannelSection title="DirectMessage" defaultOpen count={dm.length}>
                            {dm.map((ch) => (
                                <ChannelListItem
                                    key={ch.channelId}
                                    channelId={ch.channelId}
                                    name={ch.participants.filter((p) => p !== 'me').join(', ') || 'DM'}
                                    lastMessage={ch.lastMessage}
                                />
                            ))}
                        </ChannelSection>
                    )}
                </div>
            )}
        </div>
    )
}
