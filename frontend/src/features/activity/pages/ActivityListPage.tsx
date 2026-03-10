import { useActivities, useDeleteActivity } from '@/features/activity/hooks/useActivityQueries'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function ActivityListPage() {
    const { communityId } = useParams<{ communityId: string }>()
    const navigate = useNavigate()
    const { data, isLoading } = useActivities(communityId!)
    const deleteMutation = useDeleteActivity(communityId!)

    if (isLoading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>

    const activities = data?.activities ?? []

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">アクティビティ</h1>
                <button
                    onClick={() => navigate(`/communities/${communityId}/activities/new`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    + 新規作成
                </button>
            </div>

            {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">まだアクティビティがありません</p>
            ) : (
                <ul className="space-y-3">
                    {activities.map((a) => (
                        <li key={a.id} className="p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
                            <Link to={`/activities/${a.id}`} className="flex-1">
                                <p className="font-semibold">{a.title}</p>
                                {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
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
