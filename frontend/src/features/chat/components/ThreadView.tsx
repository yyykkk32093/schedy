import { useAuth } from '@/app/providers/AuthProvider'
import { DateSeparator } from '@/features/chat/components/DateSeparator'
import { EmojiPickerModal } from '@/features/chat/components/EmojiPickerModal'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import { MessageInput } from '@/features/chat/components/MessageInput'
import { useDeleteMessage, useReplies, useSendMessage, useUploadAttachment } from '@/features/chat/hooks/useChatQueries'
import { useSocketChat } from '@/features/chat/hooks/useSocketChat'
import { StampPickerModal } from '@/features/stamp/components/StampPickerModal'
import { useAddReaction, useRemoveReaction } from '@/features/stamp/hooks/useStampQueries'
import type { MessageItem } from '@/shared/types/api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ThreadViewProps {
    /** チャンネル ID（WS / mutation 用） */
    channelId: string
    /** 親メッセージ（スレッドのルート） */
    parentMessage: MessageItem
    /** スレッドを閉じるコールバック */
    onClose: () => void
}

/**
 * ThreadView — スレッド（返信）表示オーバーレイ
 *
 * 右からスライドインするパネルで、親メッセージ + 返信一覧 + 入力フォームを表示。
 * URL searchParams `?thread=messageId` と連動して ChatView から呼び出される。
 */
export function ThreadView({ channelId, parentMessage, onClose }: ThreadViewProps) {
    const { user } = useAuth()
    const currentUserId = user?.userId ?? ''

    const { data, isLoading } = useReplies(parentMessage.id)
    const sendMessage = useSendMessage(channelId)
    const deleteMessage = useDeleteMessage(channelId)
    const uploadAttachment = useUploadAttachment(channelId)
    const addReaction = useAddReaction(channelId)
    const removeReaction = useRemoveReaction(channelId)
    const [pickerMessageId, setPickerMessageId] = useState<string | null>(null)
    const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // WebSocket 接続（thread:new のキャッシュ更新は useSocketChat 側で処理済み）
    useSocketChat({ channelId })

    const replies = useMemo(() => {
        if (!data?.messages) return []
        // 返信は createdAt ASC（サーバーから昇順で返却済み）
        return data.messages
    }, [data?.messages])

    // 新着返信時にスクロール
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [replies.length])

    const handleSend = (content: string, files: File[]) => {
        sendMessage.mutate(
            {
                content,
                parentMessageId: parentMessage.id,
            },
            {
                onSuccess: (result) => {
                    for (const file of files) {
                        uploadAttachment.mutate({ messageId: result.messageId, file })
                    }
                },
            },
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* 背景オーバーレイ */}
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />

            {/* スレッドパネル */}
            <div className="relative w-full max-w-md bg-white flex flex-col h-full shadow-xl animate-slide-in-right">
                {/* ヘッダー */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900">スレッド</h2>
                        <p className="text-xs text-gray-500 truncate">
                            {parentMessage.senderDisplayName ?? '不明なユーザー'} のメッセージへの返信
                        </p>
                    </div>
                </div>

                {/* メッセージエリア */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
                    {/* 親メッセージ */}
                    <div className="border-b border-gray-100 pb-2 mb-2">
                        <MessageBubble
                            messageId={parentMessage.id}
                            senderId={parentMessage.senderId}
                            senderName={parentMessage.senderDisplayName ?? undefined}
                            senderAvatarUrl={parentMessage.senderAvatarUrl ?? undefined}
                            content={parentMessage.content}
                            attachments={parentMessage.attachments}
                            reactions={parentMessage.reactions}
                            replyCount={0}
                            createdAt={parentMessage.createdAt}
                            isMine={parentMessage.senderId === currentUserId}
                            isContinuation={false}
                            deletedBy={parentMessage.deletedBy ?? null}
                            onAddReaction={(mid, params) => addReaction.mutate({ messageId: mid, ...params })}
                            onRemoveReaction={(mid, identifier) => removeReaction.mutate({ messageId: mid, identifier })}
                            onOpenStampPicker={(mid) => setPickerMessageId(mid)}
                            onOpenEmojiPicker={(mid) => setEmojiPickerMessageId(mid)}
                            onDelete={(mid) => deleteMessage.mutate(mid)}
                        />
                    </div>

                    {/* 返信カウント */}
                    {parentMessage.replyCount > 0 && (
                        <p className="text-xs text-gray-500 px-4 py-1">
                            {parentMessage.replyCount}件の返信
                        </p>
                    )}

                    {/* 返信一覧 */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    ) : replies.length === 0 ? (
                        <p className="text-gray-400 text-center py-10 text-sm">返信はまだありません</p>
                    ) : (
                        replies.map((msg, index) => {
                            const prevMsg = index > 0 ? replies[index - 1] : null
                            const showDateSeparator =
                                !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
                            const isContinuation =
                                !!prevMsg &&
                                prevMsg.senderId === msg.senderId &&
                                isSameTimeGroup(prevMsg.createdAt, msg.createdAt)

                            return (
                                <div key={msg.id}>
                                    {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                                    <MessageBubble
                                        messageId={msg.id}
                                        senderId={msg.senderId}
                                        senderName={msg.senderDisplayName ?? undefined}
                                        senderAvatarUrl={msg.senderAvatarUrl ?? undefined}
                                        content={msg.content}
                                        attachments={msg.attachments}
                                        reactions={msg.reactions}
                                        replyCount={0}
                                        createdAt={msg.createdAt}
                                        isMine={msg.senderId === currentUserId}
                                        isContinuation={isContinuation}
                                        deletedBy={msg.deletedBy ?? null}
                                        onAddReaction={(mid, params) => addReaction.mutate({ messageId: mid, ...params })}
                                        onRemoveReaction={(mid, identifier) => removeReaction.mutate({ messageId: mid, identifier })}
                                        onOpenStampPicker={(mid) => setPickerMessageId(mid)}
                                        onOpenEmojiPicker={(mid) => setEmojiPickerMessageId(mid)}
                                        onDelete={(mid) => deleteMessage.mutate(mid)}
                                    />
                                </div>
                            )
                        })
                    )}
                </div>

                {/* 返信入力 */}
                <MessageInput onSend={handleSend} isSending={sendMessage.isPending} placeholder="返信を入力..." />

                {/* スタンプピッカー */}
                {pickerMessageId && (
                    <StampPickerModal
                        onSelect={(stampId) => addReaction.mutate({ messageId: pickerMessageId, stampId })}
                        onClose={() => setPickerMessageId(null)}
                    />
                )}

                {/* 絵文字ピッカー */}
                {emojiPickerMessageId && (
                    <EmojiPickerModal
                        onSelect={(emoji) => addReaction.mutate({ messageId: emojiPickerMessageId, emoji })}
                        onClose={() => setEmojiPickerMessageId(null)}
                    />
                )}
            </div>
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
