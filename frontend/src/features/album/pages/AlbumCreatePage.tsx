import { useCreateAlbum } from '@/features/album/hooks/useAlbumQueries'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * AlbumCreatePage — アルバム新規作成ページ
 *
 * FAB からの遷移先。作成完了後はコミュニティ詳細のアルバムタブに戻る。
 */
export function AlbumCreatePage() {
    const { communityId } = useParams<{ communityId: string }>()
    const navigate = useNavigate()
    const createAlbumMutation = useCreateAlbum(communityId!)

    const now = new Date()
    const defaultTitle = `${now.getFullYear()}年${now.getMonth() + 1}月 アルバム`

    const [title, setTitle] = useState(defaultTitle)
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        await createAlbumMutation.mutateAsync({
            title: title.trim(),
            description: description.trim() || undefined,
        })
        navigate(`/communities/${communityId}?tab=album`, { replace: true })
    }

    const handleCancel = () => {
        navigate(-1)
    }

    return (
        <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="album-title" className="text-sm font-medium text-gray-700">
                        アルバム名
                    </label>
                    <Input
                        id="album-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="アルバム名を入力"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="album-description" className="text-sm font-medium text-gray-700">
                        説明（任意）
                    </label>
                    <Input
                        id="album-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="説明を入力"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        type="submit"
                        disabled={!title.trim() || createAlbumMutation.isPending}
                        className="flex-1"
                    >
                        {createAlbumMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            '作成'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1"
                    >
                        キャンセル
                    </Button>
                </div>
            </form>
        </div>
    )
}
