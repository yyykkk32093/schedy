import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementAsRead } from '@/features/announcement/hooks/useAnnouncementQueries'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function AnnouncementListPage() {
    const { communityId } = useParams<{ communityId: string }>()
    const navigate = useNavigate()
    const { data, isLoading } = useAnnouncements(communityId!)
    const createMutation = useCreateAnnouncement(communityId!)
    const deleteMutation = useDeleteAnnouncement(communityId!)
    const markReadMutation = useMarkAnnouncementAsRead(communityId!)

    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const handleCreate = async () => {
        if (!title.trim()) return
        const res = await createMutation.mutateAsync({ title: title.trim(), content: content.trim() })
        setTitle('')
        setContent('')
        setShowForm(false)
        navigate(`/announcements/${res.announcementId}`)
    }

    if (isLoading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>

    const announcements = data?.announcements ?? []

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">お知らせ</h1>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    {showForm ? 'キャンセル' : '+ 新規作成'}
                </button>
            </div>

            {showForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3">
                    <input
                        type="text"
                        placeholder="タイトル"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                    <textarea
                        placeholder="本文"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={4}
                    />
                    <button onClick={handleCreate} disabled={createMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                        投稿
                    </button>
                </div>
            )}

            {announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">まだお知らせがありません</p>
            ) : (
                <ul className="space-y-3">
                    {announcements.map((a) => (
                        <li key={a.id} className="p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
                            <Link to={`/announcements/${a.id}`} className="flex-1" onClick={() => { if (!a.isRead) markReadMutation.mutate(a.id) }}>
                                <div className="flex items-center gap-2">
                                    {!a.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                    <p className={`font-semibold ${!a.isRead ? 'text-black' : 'text-gray-700'}`}>{a.title}</p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString('ja-JP')}</p>
                            </Link>
                            <button
                                onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(a.id) }}
                                className="text-red-500 text-sm hover:underline ml-4"
                            >
                                削除
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
