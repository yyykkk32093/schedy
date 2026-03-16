import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ImagePreviewGallery } from '@/shared/components/ui/ImagePreviewModal'
import { cn } from '@/shared/lib/utils'
import type { MessageAttachment, MessageReactionSummary } from '@/shared/types/api'
import { estimateLineCount, formatTime } from '@/shared/utils/dateFormat'
import { Smile, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface MessageBubbleProps {
    /** メッセージID */
    messageId: string
    /** 送信者ID */
    senderId: string
    /** 送信者名 (#23) */
    senderName?: string
    /** 送信者アバターURL (#23) */
    senderAvatarUrl?: string
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
    /** 論理削除したユーザーID（null = 未削除） */
    deletedBy: string | null
    /** リアクション追加コールバック（stampId or emoji） */
    onAddReaction: (messageId: string, params: { stampId?: string; emoji?: string }) => void
    /** リアクション削除コールバック（identifier = stampId or emoji） */
    onRemoveReaction: (messageId: string, identifier: string) => void
    /** スタンプピッカー表示コールバック */
    onOpenStampPicker: (messageId: string) => void
    /** 絵文字ピッカー表示コールバック */
    onOpenEmojiPicker?: (messageId: string) => void
    /** メッセージ削除コールバック */
    onDelete: (messageId: string) => void
}

/** クイックリアクション絵文字 */
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'] as const

/**
 * メッセージバブル — Mockup準拠
 * 送信 = 黒背景・白テキスト・右寄せ
 * 受信 = グレー背景・黒テキスト・左寄せ
 */
export function MessageBubble({
    messageId,
    senderId,
    senderName,
    senderAvatarUrl,
    content,
    attachments,
    reactions,
    replyCount,
    isMine,
    isContinuation,
    createdAt,
    deletedBy,
    onAddReaction,
    onRemoveReaction,
    onOpenStampPicker,
    onOpenEmojiPicker,
    onDelete,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false)
    // #22: インライン展開状態
    const [isExpanded, setIsExpanded] = useState(false)
    // #20: 削除確認ダイアログ
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    // #18: クイックリアクションバー表示
    const [showQuickReactions, setShowQuickReactions] = useState(false)

    const isDeleted = !!deletedBy
    const lineCount = estimateLineCount(content)
    const isLongMessage = lineCount > 80
    const shouldClamp = isLongMessage && !isExpanded

    // #24: 画像/非画像を分離
    const imageAttachments = attachments.filter((a) => a.mimeType?.startsWith('image/'))
    const fileAttachments = attachments.filter((a) => !a.mimeType?.startsWith('image/'))

    return (
        <div
            className={cn('flex gap-2 px-4', isMine ? 'justify-end' : 'justify-start', !isContinuation ? 'mt-3' : 'mt-0.5')}
            onTouchStart={() => !isDeleted && setShowActions(true)}
            onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
            onMouseEnter={() => !isDeleted && setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* 受信側: アバター（連続時は非表示でスペース確保） */}
            {!isMine && (
                <div className="w-8 shrink-0">
                    {!isContinuation && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={senderAvatarUrl} alt={senderName ?? senderId} />
                            <AvatarFallback className="text-xs bg-gray-200">
                                {(senderName ?? senderId).slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            {/* #21: アクションアイコン（自分のメッセージ = バブル左、相手 = バブル右） */}
            {isMine && showActions && !isDeleted && (
                <div className="flex flex-col gap-1 items-center justify-center self-center relative">
                    <button
                        type="button"
                        onClick={() => setShowQuickReactions((v) => !v)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                        title="リアクション"
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        title="削除"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    {/* #18: クイックリアクションバー */}
                    {showQuickReactions && (
                        <div className="absolute bottom-full mb-1 right-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-lg z-10">
                            {QUICK_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        onAddReaction(messageId, { emoji })
                                        setShowQuickReactions(false)
                                    }}
                                    className="text-lg hover:scale-125 transition-transform p-0.5"
                                >
                                    {emoji}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQuickReactions(false)
                                    if (onOpenEmojiPicker) onOpenEmojiPicker(messageId)
                                    else onOpenStampPicker(messageId)
                                }}
                                className="text-xs text-gray-400 hover:text-blue-500 px-1"
                                title="もっと見る"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className={cn('flex flex-col max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                {/* #23: 送信者名（自分以外 & 非連続時） */}
                {!isMine && !isContinuation && senderName && (
                    <p className="text-[10px] text-gray-500 font-medium mb-0.5 ml-1">{senderName}</p>
                )}

                {/* #19: 削除済みメッセージ */}
                {isDeleted ? (
                    <div className="px-3 py-2 text-sm leading-relaxed italic text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl">
                        このメッセージは削除されました
                    </div>
                ) : (
                    <>
                        {/* バブル本体 */}
                        <div
                            className={cn(
                                'px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                                isMine
                                    ? 'bg-gray-900 text-white rounded-2xl rounded-br-md'
                                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md',
                                // #22: 行数制限
                                shouldClamp && 'line-clamp-[60]',
                            )}
                        >
                            {content}
                        </div>

                        {/* #22: 「全て表示」/「閉じる」リンク */}
                        {isLongMessage && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-blue-500 hover:text-blue-600 mt-0.5 ml-1"
                            >
                                {isExpanded ? '閉じる' : '全て表示'}
                            </button>
                        )}

                        {/* #24: 添付画像プレビュー */}
                        {imageAttachments.length > 0 && (
                            <div className="mt-1">
                                <ImagePreviewGallery
                                    images={imageAttachments.map((att) => ({ src: att.fileUrl, alt: att.fileName }))}
                                    className="h-32 w-auto max-w-[200px] rounded-lg object-cover cursor-pointer"
                                />
                            </div>
                        )}

                        {/* 非画像添付ファイル（従来のリンク表示） */}
                        {fileAttachments.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {fileAttachments.map((att) => (
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
                    </>
                )}

                {/* #28: 送受信時間表示 */}
                <p className="text-[10px] text-gray-400 mt-0.5 mx-1">
                    {formatTime(createdAt)}
                </p>

                {/* リアクション表示（削除済みは非表示） */}
                {!isDeleted && reactions.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                        {reactions.map((r) => {
                            const key = r.emoji ?? r.stampId ?? ''
                            const identifier = r.emoji ?? r.stampId ?? ''
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() =>
                                        r.reacted
                                            ? onRemoveReaction(messageId, identifier)
                                            : onAddReaction(messageId, r.emoji ? { emoji: r.emoji } : { stampId: r.stampId! })
                                    }
                                    className={cn(
                                        'text-xs border rounded-full px-2 py-0.5 transition-colors cursor-pointer flex items-center gap-0.5',
                                        r.reacted
                                            ? 'bg-blue-100 border-blue-300 hover:bg-blue-200'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                                    )}
                                >
                                    {r.emoji ? (
                                        <span className="text-sm">{r.emoji}</span>
                                    ) : r.stampImageUrl ? (
                                        <img src={r.stampImageUrl} alt="" className="w-4 h-4 inline-block" />
                                    ) : (
                                        <span>{(r.stampId ?? '').slice(0, 4)}</span>
                                    )}
                                    <span>{r.count}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* スレッド返信カウント */}
                {replyCount > 0 && (
                    <p className="text-xs text-blue-500 mt-0.5">💬 {replyCount}件の返信</p>
                )}
            </div>

            {/* #21: アクションアイコン（相手のメッセージ = バブル右） */}
            {!isMine && showActions && !isDeleted && (
                <div className="flex flex-col gap-1 items-center justify-center self-center relative">
                    <button
                        type="button"
                        onClick={() => setShowQuickReactions((v) => !v)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                        title="リアクション"
                    >
                        <Smile className="w-4 h-4" />
                    </button>

                    {/* #18: クイックリアクションバー（相手のメッセージ） */}
                    {showQuickReactions && (
                        <div className="absolute bottom-full mb-1 left-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-lg z-10">
                            {QUICK_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        onAddReaction(messageId, { emoji })
                                        setShowQuickReactions(false)
                                    }}
                                    className="text-lg hover:scale-125 transition-transform p-0.5"
                                >
                                    {emoji}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQuickReactions(false)
                                    if (onOpenEmojiPicker) onOpenEmojiPicker(messageId)
                                    else onOpenStampPicker(messageId)
                                }}
                                className="text-xs text-gray-400 hover:text-blue-500 px-1"
                                title="もっと見る"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* #20: 削除確認ダイアログ */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-gray-800 mb-2">メッセージを削除</h3>
                        <p className="text-sm text-gray-500 mb-6">このメッセージを削除しますか？この操作は元に戻せません。</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(messageId)
                                    setShowDeleteConfirm(false)
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                                削除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
