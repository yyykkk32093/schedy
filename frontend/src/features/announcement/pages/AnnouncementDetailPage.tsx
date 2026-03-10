import { useAnnouncement } from '@/features/announcement/hooks/useAnnouncementQueries'
import { useParams } from 'react-router-dom'

export function AnnouncementDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { data: announcement, isLoading } = useAnnouncement(id!)

    if (isLoading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>
    if (!announcement) return <div className="p-6 text-center text-red-500">お知らせが見つかりません</div>

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">{announcement.title}</h1>
            <p className="text-xs text-gray-400 mb-4">{new Date(announcement.createdAt).toLocaleDateString('ja-JP')}</p>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                {announcement.content}
            </div>

            {/* 添付画像 (0-4 fix) */}
            {announcement.attachments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {announcement.attachments
                        .filter((a) => a.mimeType.startsWith('image/'))
                        .map((att) => (
                            <img
                                key={att.id}
                                src={att.fileUrl}
                                alt=""
                                className="h-48 w-auto max-w-full rounded-lg object-cover border"
                            />
                        ))}
                </div>
            )}
        </div>
    )
}
