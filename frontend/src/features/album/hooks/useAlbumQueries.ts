import { albumApi } from '@/features/album/api/albumApi'
import { albumListKeys, albumPhotoKeys } from '@/shared/lib/queryKeys'
import type { AddAlbumPhotoRequest, CreateAlbumRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** コミュニティのアルバム一覧 */
export function useAlbums(communityId: string) {
    return useQuery({
        queryKey: albumListKeys.byCommunity(communityId),
        queryFn: () => albumApi.list(communityId),
        enabled: !!communityId,
    })
}

/** アルバム作成 */
export function useCreateAlbum(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateAlbumRequest) => albumApi.create(communityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: albumListKeys.byCommunity(communityId) }),
    })
}

/** アルバム内の写真一覧 */
export function useAlbumPhotos(albumId: string) {
    return useQuery({
        queryKey: albumPhotoKeys.byAlbum(albumId),
        queryFn: () => albumApi.listPhotos(albumId),
        enabled: !!albumId,
    })
}

/** 写真追加 */
export function useAddAlbumPhoto(albumId: string, communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: AddAlbumPhotoRequest) => albumApi.addPhoto(albumId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: albumPhotoKeys.byAlbum(albumId) })
            qc.invalidateQueries({ queryKey: albumListKeys.byCommunity(communityId) })
        },
    })
}

/** 写真削除 */
export function useDeleteAlbumPhoto(albumId: string, communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (photoId: string) => albumApi.deletePhoto(photoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: albumPhotoKeys.byAlbum(albumId) })
            qc.invalidateQueries({ queryKey: albumListKeys.byCommunity(communityId) })
        },
    })
}
