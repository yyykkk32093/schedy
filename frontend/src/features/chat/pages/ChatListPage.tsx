import { ChannelListItem } from '@/features/chat/components/ChannelListItem'
import { ChannelSection } from '@/features/chat/components/ChannelSection'
import { ChatSearchBar } from '@/features/chat/components/ChatSearchBar'
import { useMyChannels } from '@/features/chat/hooks/useChatQueries'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible'
import type { MyActivityChannel } from '@/shared/types/api'
import { ChevronDown, Loader2, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

/** アクティビティチャンネルの表示名を「アクティビティ名：開催日時」に整形 */
function formatActivityChannelName(ch: MyActivityChannel): string {
    if (ch.scheduleDate && ch.scheduleStartTime && ch.scheduleEndTime) {
        return `${ch.name}：${ch.scheduleDate} ${ch.scheduleStartTime}〜${ch.scheduleEndTime}`
    }
    return ch.name
}

/** コミュニティ名で展開・非展開できるサブグループ */
function CommunityGroup({ name, children }: { name: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true)
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-50 transition-colors">
                <span className="text-xs font-semibold text-gray-500">{name}</span>
                <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </CollapsibleTrigger>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    )
}

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

                    {/* Activity セクション（コミュニティ名でグルーピング＋展開・非展開） */}
                    {activity.length > 0 && (
                        <ChannelSection title="Activity" defaultOpen count={activity.length}>
                            {(() => {
                                // コミュニティ名でグルーピング
                                const grouped = new Map<string, typeof activity>()
                                for (const ch of activity) {
                                    const key = ch.communityName || ch.subtitle || '不明'
                                    const arr = grouped.get(key) ?? []
                                    arr.push(ch)
                                    grouped.set(key, arr)
                                }
                                return Array.from(grouped.entries()).map(([communityName, channels]) => (
                                    <CommunityGroup key={communityName} name={communityName}>
                                        {channels.map((ch) => (
                                            <ChannelListItem
                                                key={ch.channelId}
                                                channelId={ch.channelId}
                                                name={formatActivityChannelName(ch)}
                                                lastMessage={ch.lastMessage}
                                            />
                                        ))}
                                    </CommunityGroup>
                                ))
                            })()}
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
