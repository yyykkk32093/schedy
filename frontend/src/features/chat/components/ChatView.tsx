import { useAuth } from '@/app/providers/AuthProvider'
import { ChannelSearchPanel } from '@/features/chat/components/ChannelSearchPanel'
import { ChatHeader } from '@/features/chat/components/ChatHeader'
import { DateSeparator } from '@/features/chat/components/DateSeparator'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import { MessageInput } from '@/features/chat/components/MessageInput'
import { useDeleteMessage, useMessages, useSendMessage, useUploadAttachment } from '@/features/chat/hooks/useChatQueries'
import { useSocketChat } from '@/features/chat/hooks/useSocketChat'
import { StampPickerModal } from '@/features/stamp/components/StampPickerModal'
import { useAddReaction, useRemoveReaction } from '@/features/stamp/hooks/useStampQueries'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ChatViewProps {
    /** チャンネルID */
    channelId: string
    /** ヘッダーを表示するか（デフォルト: true） */
    showHeader?: boolean
    /** ヘッダーに表示するチャンネル名 */
    headerName?: string
}

/**
 * ChatView — チャット表示+入力+WebSocket のコアコンポーネント
 *
 * ChannelPage（フルスクリーン）とコミュニティ詳細のチャットタブ（埋め込み）
 * の両方から利用される。
 */
export function ChatView({ channelId, showHeader = true, headerName = 'チャット' }: ChatViewProps) {
    const { user } = useAuth()
    const currentUserId = user?.userId ?? ''

    const { data, isLoading, error } = useMessages(channelId)
    const sendMessage = useSendMessage(channelId)
    const deleteMessage = useDeleteMessage(channelId)
    const uploadAttachment = useUploadAttachment(channelId)
    const addReaction = useAddReaction(channelId)
    const removeReaction = useRemoveReaction(channelId)
    const [pickerMessageId, setPickerMessageId] = useState<string | null>(null)
    const [showSearch, setShowSearch] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // WebSocket リアルタイムフック（channel:join/leave 自動管理 + message:new キャッシュ更新）
    const { typingUsers: _typingUsers } = useSocketChat({ channelId })

    // メッセージを時系列昇順に並べ替え
    const messages = useMemo(() => {
        if (!data?.messages) return []
        return [...data.messages].reverse()
    }, [data?.messages])

    // 新着時にスクロール
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages.length])

    const handleSend = (content: string, files: File[]) => {
        sendMessage.mutate({ content }, {
            onSuccess: (result) => {
                for (const file of files) {
                    uploadAttachment.mutate({ messageId: result.messageId, file })
                }
            },
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-red-500">エラーが発生しました</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* チャットヘッダー */}
            {showHeader && (
                <ChatHeader
                    name={headerName}
                    subtitle="Active"
                    onSearchToggle={() => setShowSearch((v) => !v)}
                />
            )}

            {/* メッセージ検索パネル */}
            {showSearch && (
                <ChannelSearchPanel
                    channelId={channelId}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {/* メッセージエリア */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
                {messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-20 text-sm">メッセージはまだありません</p>
                ) : (
                    messages.map((msg, index) => {
                        const prevMsg = index > 0 ? messages[index - 1] : null
                        const isContinuation =
                            !!prevMsg &&
                            prevMsg.senderId === msg.senderId &&
                            isSameTimeGroup(prevMsg.createdAt, msg.createdAt)
                        const showDateSeparator =
                            !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)

                        return (
                            <div key={msg.id}>
                                {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                                <MessageBubble
                                    messageId={msg.id}
                                    senderId={msg.senderId}
                                    content={msg.content}
                                    attachments={msg.attachments}
                                    reactions={msg.reactions}
                                    replyCount={msg.replyCount}
                                    createdAt={msg.createdAt}
                                    isMine={msg.senderId === currentUserId}
                                    isContinuation={isContinuation}
                                    onAddReaction={(mid, sid) => addReaction.mutate({ messageId: mid, stampId: sid })}
                                    onRemoveReaction={(mid, sid) => removeReaction.mutate({ messageId: mid, stampId: sid })}
                                    onOpenStampPicker={(mid) => setPickerMessageId(mid)}
                                    onDelete={(mid) => deleteMessage.mutate(mid)}
                                />
                            </div>
                        )
                    })
                )}
            </div>

            {/* メッセージ入力 */}
            <MessageInput onSend={handleSend} isSending={sendMessage.isPending} />

            {/* スタンプピッカー */}
            {pickerMessageId && (
                <StampPickerModal
                    onSelect={(stampId) => addReaction.mutate({ messageId: pickerMessageId, stampId })}
                    onClose={() => setPickerMessageId(null)}
                />
            )}
        </div>
    )
}

/** 同じ日付か判定 */
function isSameDay(a: string, b: string): boolean {
    return a.slice(0, 10) === b.slice(0, 10)
}

/** 連続メッセージのグルーピング判定（5分以内） */
function isSameTimeGroup(a: string, b: string): boolean {
    const diff = Math.abs(new Date(b).getTime() - new Date(a).getTime())
    return diff < 5 * 60 * 1000
}
