import { announcementApi } from '@/features/announcement/api/announcementApi'
import { useToggleAnnouncementLike } from '@/features/announcement/hooks/useAnnouncementSocialQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { announcementFeedKeys } from '@/shared/lib/queryKeys'
import type { AnnouncementFeedItem } from '@/shared/types/api'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CommentSection } from './CommentSection'

interface FeedCardProps {
    item: AnnouncementFeedItem
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60_000)

    if (diffMin < 1) return 'たった今'
    if (diffMin < 60) return `${diffMin}分前`

    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}時間前`

    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 30) return `${diffDay}日前`

    const diffMonth = Math.floor(diffDay / 30)
    return `${diffMonth}ヶ月前`
}

function getInitial(name: string | null): string {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
}

export function FeedCard({ item }: FeedCardProps) {
    const qc = useQueryClient()
    const [menuOpen, setMenuOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)

    const likeMutation = useToggleAnnouncementLike()

    const handleMarkAsRead = async () => {
        await announcementApi.markAsRead(item.id)
        qc.invalidateQueries({ queryKey: announcementFeedKeys.all })
        setMenuOpen(false)
    }

    const imageAttachments = item.attachments?.filter((a) => a.mimeType.startsWith('image/')) ?? []

    return (
        <article className="px-4 py-3">
            {/* ヘッダー: アバター + 名前 + 時間 + メニュー */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={item.authorAvatarUrl ?? undefined}
                            alt={item.authorName ?? 'ユーザー'}
                        />
                        <AvatarFallback className="text-xs">
                            {getInitial(item.authorName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm leading-tight">
                            <span className="font-semibold">{item.authorName ?? '名前なし'}</span>
                            <span className="text-gray-500"> in </span>
                            <Link
                                to={`/communities/${item.communityId}`}
                                className="font-semibold hover:underline"
                            >
                                {item.communityName}
                            </Link>
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo(item.createdAt)}</p>
                    </div>
                </div>

                {/* 3ドットメニュー */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border bg-white py-1 shadow-md">
                                {!item.isRead && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAsRead}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        既読にする
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 本文（クリックでコメント展開） */}
            <button
                type="button"
                onClick={() => setCommentsOpen(!commentsOpen)}
                className="mt-2.5 pl-[42px] text-left w-full"
            >
                {item.title && (
                    <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                )}
                <p className="mt-1 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {item.content}
                </p>
            </button>

            {/* UBL-3: 添付画像カルーセル */}
            {imageAttachments.length > 0 && (
                <div className="mt-2 pl-[42px]">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {imageAttachments.map((att) => (
                            <img
                                key={att.id}
                                src={att.fileUrl}
                                alt=""
                                className="h-40 w-auto max-w-[240px] rounded-lg object-cover flex-shrink-0"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* UBL-1 / UBL-2: いいね＋コメント アクションバー */}
            <div className="mt-2 pl-[42px] flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => likeMutation.mutate(item.id)}
                    disabled={likeMutation.isPending}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                    <Heart
                        className={`h-4 w-4 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    {item.likeCount > 0 && <span>{item.likeCount}</span>}
                </button>

                <button
                    type="button"
                    onClick={() => setCommentsOpen(!commentsOpen)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                >
                    <MessageCircle className="h-4 w-4" />
                    {item.commentCount > 0 && <span>{item.commentCount}</span>}
                </button>
            </div>

            {/* 未読インジケーター */}
            {!item.isRead && (
                <div className="mt-2 pl-[42px]">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                </div>
            )}

            {/* UBL-2: コメントセクション */}
            {commentsOpen && (
                <div className="mt-2 pl-[42px]">
                    <CommentSection announcementId={item.id} />
                </div>
            )}
        </article>
    )
}
