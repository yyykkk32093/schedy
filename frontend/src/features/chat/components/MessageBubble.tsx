import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { cn } from '@/shared/lib/utils'
import type { MessageAttachment, MessageReactionSummary } from '@/shared/types/api'
import { useState } from 'react'

interface MessageBubbleProps {
    /** メッセージID */
    messageId: string
    /** 送信者ID */
    senderId: string
    /** メッセージ本文 */
    content: string
    /** 添付ファイル */
    attachments: MessageAttachment[]
    /** リアクション集計 */
    reactions: MessageReactionSummary[]
    /** スレッド返信数 */
    replyCount: number
    /** 送信日時 */
    createdAt: string
    /** 自分のメッセージか */
    isMine: boolean
    /** 前のメッセージと同じ送信者か（連続グルーピング） */
    isContinuation: boolean
    /** リアクション追加コールバック */
    onAddReaction: (messageId: string, stampId: string) => void
    /** リアクション削除コールバック */
    onRemoveReaction: (messageId: string, stampId: string) => void
    /** スタンプピッカー表示コールバック */
    onOpenStampPicker: (messageId: string) => void
    /** メッセージ削除コールバック */
    onDelete: (messageId: string) => void
}

/**
 * メッセージバブル — Mockup準拠
 * 送信 = 黒背景・白テキスト・右寄せ
 * 受信 = グレー背景・黒テキスト・左寄せ
 */
export function MessageBubble({
    messageId,
    senderId,
    content,
    attachments,
    reactions,
    replyCount,
    isMine,
    isContinuation,
    onAddReaction,
    onRemoveReaction,
    onOpenStampPicker,
    onDelete,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false)

    return (
        <div
            className={cn('flex gap-2 px-4', isMine ? 'justify-end' : 'justify-start', !isContinuation ? 'mt-3' : 'mt-0.5')}
            onTouchStart={() => setShowActions(true)}
            onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* 受信側: アバター（連続時は非表示でスペース確保） */}
            {!isMine && (
                <div className="w-8 shrink-0">
                    {!isContinuation && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-gray-200">
                                {senderId.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            <div className={cn('flex flex-col max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                {/* バブル本体 */}
                <div
                    className={cn(
                        'px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                        isMine
                            ? 'bg-gray-900 text-white rounded-2xl rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md',
                    )}
                >
                    {content}
                </div>

                {/* 添付ファイル */}
                {attachments.length > 0 && (
                    <div className="mt-1 space-y-1">
                        {attachments.map((att) => (
                            <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline block"
                            >
                                📎 {att.fileName}
                            </a>
                        ))}
                    </div>
                )}

                {/* リアクション表示 */}
                {reactions.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                        {reactions.map((r) => (
                            <button
                                key={r.stampId}
                                type="button"
                                onClick={() =>
                                    r.reacted
                                        ? onRemoveReaction(messageId, r.stampId)
                                        : onAddReaction(messageId, r.stampId)
                                }
                                className={cn(
                                    'text-xs border rounded-full px-2 py-0.5 transition-colors cursor-pointer',
                                    r.reacted
                                        ? 'bg-blue-100 border-blue-300 hover:bg-blue-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                                )}
                            >
                                {r.stampId.slice(0, 4)} × {r.count}
                            </button>
                        ))}
                    </div>
                )}

                {/* アクション行（ホバー / 長押しで表示） */}
                {showActions && (
                    <div className="flex items-center gap-2 mt-0.5">
                        <button
                            type="button"
                            onClick={() => onOpenStampPicker(messageId)}
                            className="text-xs text-gray-400 hover:text-blue-500"
                        >
                            リアクション
                        </button>
                        {isMine && (
                            <button
                                type="button"
                                onClick={() => onDelete(messageId)}
                                className="text-xs text-gray-400 hover:text-red-500"
                            >
                                削除
                            </button>
                        )}
                    </div>
                )}

                {/* スレッド返信カウント */}
                {replyCount > 0 && (
                    <p className="text-xs text-blue-500 mt-0.5">💬 {replyCount}件の返信</p>
                )}
            </div>
        </div>
    )
}
