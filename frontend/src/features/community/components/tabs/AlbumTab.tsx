import {
    useAlbumPhotos,
    useAlbums,
    useDeleteAlbumPhoto,
} from '@/features/album/hooks/useAlbumQueries'
import type { AlbumItem } from '@/shared/types/api'
import { ArrowLeft, ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

/**
 * AlbumTab — コミュニティ詳細のアルバムタブ（UBL-6）
 *
 * アルバム一覧 → 写真グリッド の2階層ナビゲーション
 */
export function AlbumTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null)

    const { data: albumsData, isLoading: albumsLoading } = useAlbums(communityId!)

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
            <div className="px-1 mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">アルバム</h3>
            </div>

            {albumsLoading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}

            {!albumsLoading && albums.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium text-gray-500">アルバムはまだありません</p>
                    <p className="text-xs mt-1">FABボタンからアルバムを作成できます</p>
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
    const deletePhotoMutation = useDeleteAlbumPhoto(album.id, communityId)

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
                <div className="w-10" /> {/* spacer for symmetry */}
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
