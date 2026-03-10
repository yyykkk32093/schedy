import {
    useAddAlbumPhoto,
    useAlbumPhotos,
    useAlbums,
    useCreateAlbum,
    useDeleteAlbumPhoto,
} from '@/features/album/hooks/useAlbumQueries'
import { uploadFile } from '@/shared/lib/uploadClient'
import type { AlbumItem } from '@/shared/types/api'
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

/**
 * AlbumTab — コミュニティ詳細のアルバムタブ（UBL-6）
 *
 * アルバム一覧 → 写真グリッド の2階層ナビゲーション
 */
export function AlbumTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDescription, setNewDescription] = useState('')

    const { data: albumsData, isLoading: albumsLoading } = useAlbums(communityId!)
    const createAlbumMutation = useCreateAlbum(communityId!)

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle.trim()) return
        await createAlbumMutation.mutateAsync({
            title: newTitle.trim(),
            description: newDescription.trim() || undefined,
        })
        setNewTitle('')
        setNewDescription('')
        setShowCreateForm(false)
    }

    // ── 写真一覧ビュー ──
    if (selectedAlbum) {
        return (
            <AlbumPhotoView
                album={selectedAlbum}
                communityId={communityId!}
                onBack={() => setSelectedAlbum(null)}
            />
        )
    }

    // ── アルバム一覧ビュー ──
    const albums = albumsData?.albums ?? []

    return (
        <div className="py-4">
            <div className="px-1 mb-3">
                <h3 className="font-semibold text-sm text-gray-700">アルバム</h3>
            </div>

            {/* 作成フォーム */}
            {showCreateForm && (
                <form onSubmit={handleCreateAlbum} className="mb-4 space-y-2 rounded-lg border p-3">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="アルバム名"
                        className="w-full rounded border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="説明（任意）"
                        className="w-full rounded border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={!newTitle.trim() || createAlbumMutation.isPending}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {createAlbumMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '作成'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="rounded bg-gray-200 px-3 py-1.5 text-xs hover:bg-gray-300"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            )}

            {albumsLoading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}

            {!albumsLoading && albums.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium text-gray-500">アルバムはまだありません</p>
                    <p className="text-xs mt-1">「新規作成」からアルバムを作成できます</p>
                </div>
            )}

            {/* アルバムグリッド */}
            {albums.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {albums.map((album) => (
                        <button
                            key={album.id}
                            type="button"
                            onClick={() => setSelectedAlbum(album)}
                            className="text-left rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                {album.coverUrl ? (
                                    <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                )}
                            </div>
                            <div className="p-2">
                                <p className="text-sm font-medium truncate">{album.title}</p>
                                <p className="text-xs text-gray-400">{album.photoCount}枚</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── 写真一覧サブコンポーネント ─────────────────────────

interface AlbumPhotoViewProps {
    album: AlbumItem
    communityId: string
    onBack: () => void
}

function AlbumPhotoView({ album, communityId, onBack }: AlbumPhotoViewProps) {
    const { data: photosData, isLoading } = useAlbumPhotos(album.id)
    const addPhotoMutation = useAddAlbumPhoto(album.id, communityId)
    const deletePhotoMutation = useDeleteAlbumPhoto(album.id, communityId)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length) return

        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                const result = await uploadFile(file)
                await addPhotoMutation.mutateAsync({
                    fileUrl: result.url,
                    fileName: result.fileName,
                    mimeType: result.mimeType,
                    fileSize: result.fileSize,
                })
            }
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const photos = photosData?.photos ?? []

    return (
        <div className="py-4">
            <div className="flex items-center justify-between px-1 mb-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    戻る
                </button>
                <h3 className="font-semibold text-sm">{album.title}</h3>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        写真追加
                    </button>
                </div>
            </div>

            {album.description && (
                <p className="px-1 mb-3 text-xs text-gray-500">{album.description}</p>
            )}

            {isLoading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}

            {!isLoading && photos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-xs">まだ写真がありません</p>
                </div>
            )}

            {/* 写真グリッド */}
            {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1">
                    {photos.map((photo) => (
                        <div key={photo.id} className="relative group aspect-square">
                            <img
                                src={photo.fileUrl}
                                alt={photo.fileName}
                                className="w-full h-full object-cover rounded-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('この写真を削除しますか？')) {
                                        deletePhotoMutation.mutate(photo.id)
                                    }
                                }}
                                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
