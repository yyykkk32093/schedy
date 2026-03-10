import { useAuth } from '@/app/providers/AuthProvider'
import {
    useAnnouncementComments,
    useCreateAnnouncementComment,
    useDeleteAnnouncementComment,
} from '@/features/announcement/hooks/useAnnouncementSocialQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface CommentSectionProps {
    announcementId: string
}

export function CommentSection({ announcementId }: CommentSectionProps) {
    const { data, isLoading } = useAnnouncementComments(announcementId)
    const createMutation = useCreateAnnouncementComment(announcementId)
    const deleteMutation = useDeleteAnnouncementComment(announcementId)
    const { user } = useAuth()

    const [content, setContent] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = content.trim()
        if (!trimmed) return
        await createMutation.mutateAsync({ content: trimmed })
        setContent('')
    }

    return (
        <div className="space-y-3">
            {/* コメント入力フォーム */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="コメントを入力…"
                    maxLength={2000}
                    className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
                <button
                    type="submit"
                    disabled={!content.trim() || createMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                </button>
            </form>

            {/* コメント一覧 */}
            {isLoading && (
                <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
            )}

            {data?.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={comment.userAvatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                            {comment.userName?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs">
                            <span className="font-semibold">{comment.userName ?? '名前なし'}</span>
                            <span className="ml-2 text-gray-400">
                                {new Date(comment.createdAt).toLocaleDateString('ja-JP')}
                            </span>
                        </p>
                        <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                    </div>
                    {user?.userId === comment.userId && (
                        <button
                            type="button"
                            onClick={() => deleteMutation.mutate(comment.id)}
                            disabled={deleteMutation.isPending}
                            className="flex-shrink-0 rounded p-1 text-gray-300 hover:text-red-500"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}

            {!isLoading && data?.comments.length === 0 && (
                <p className="text-xs text-gray-400 text-center">まだコメントはありません</p>
            )}
        </div>
    )
}
