import { useCreateDM, useDMChannels } from '@/features/dm/hooks/useDMQueries'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function DMListPage() {
    const { data, isLoading, error } = useDMChannels()
    const createDM = useCreateDM()
    const navigate = useNavigate()
    const [participantId, setParticipantId] = useState('')

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!participantId.trim()) return
        createDM.mutate({ participantIds: [participantId.trim()] }, {
            onSuccess: (res) => {
                setParticipantId('')
                navigate(`/channels/${res.channelId}`)
            },
        })
    }

    if (isLoading) return <p className="p-4">読み込み中...</p>
    if (error) return <p className="p-4 text-red-600">エラーが発生しました</p>

    const channels = data?.channels ?? []

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">ダイレクトメッセージ</h1>

            {/* 新規 DM 作成フォーム */}
            <form onSubmit={handleCreate} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    placeholder="ユーザーID"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    disabled={createDM.isPending || !participantId.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    新規DM
                </button>
            </form>

            {/* DM チャンネル一覧 */}
            {channels.length === 0 ? (
                <p className="text-gray-500">DMはまだありません</p>
            ) : (
                <ul className="space-y-2">
                    {channels.map((ch) => (
                        <li key={ch.channelId}>
                            <Link
                                to={`/channels/${ch.channelId}`}
                                className="block border rounded-lg p-3 hover:bg-gray-50"
                            >
                                <div className="text-sm font-medium">
                                    参加者: {ch.participants.map((p) => p.slice(0, 8)).join(', ')}
                                </div>
                                {ch.lastMessage && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        {ch.lastMessage.content}
                                    </p>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
