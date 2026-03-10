import { useCreateStamp, useDeleteStamp, useStamps } from '@/features/stamp/hooks/useStampQueries'
import { useState } from 'react'

export function StampListPage() {
    const { data, isLoading, error } = useStamps()
    const createStamp = useCreateStamp()
    const deleteStamp = useDeleteStamp()
    const [name, setName] = useState('')
    const [imageUrl, setImageUrl] = useState('')

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !imageUrl.trim()) return
        createStamp.mutate({ name: name.trim(), imageUrl: imageUrl.trim() }, {
            onSuccess: () => {
                setName('')
                setImageUrl('')
            },
        })
    }

    if (isLoading) return <p className="p-4">読み込み中...</p>
    if (error) return <p className="p-4 text-red-600">エラーが発生しました</p>

    const stamps = data?.stamps ?? []

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">スタンプ管理</h1>

            {/* 作成フォーム */}
            <form onSubmit={handleCreate} className="mb-6 space-y-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="スタンプ名"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="画像URL"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    disabled={createStamp.isPending || !name.trim() || !imageUrl.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    作成
                </button>
            </form>

            {/* スタンプ一覧 */}
            {stamps.length === 0 ? (
                <p className="text-gray-500">スタンプはまだありません</p>
            ) : (
                <div className="grid grid-cols-4 gap-3">
                    {stamps.map((s) => (
                        <div key={s.id} className="border rounded-lg p-3 text-center">
                            <img
                                src={s.imageUrl}
                                alt={s.name}
                                className="w-12 h-12 mx-auto object-contain"
                            />
                            <p className="text-xs mt-1 truncate">{s.name}</p>
                            <button
                                onClick={() => deleteStamp.mutate(s.id)}
                                type="button"
                                className="text-xs text-red-400 hover:text-red-600 mt-1"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
