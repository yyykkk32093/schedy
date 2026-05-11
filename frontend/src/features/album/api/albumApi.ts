import { http } from '@/shared/lib/apiClient'
import type {
    AddAlbumPhotoRequest,
    AddAlbumPhotoResponse,
    CreateAlbumRequest,
    CreateAlbumResponse,
    ListAlbumPhotosResponse,
    ListAlbumsResponse,
} from '@/shared/types/api'

export const albumApi = {
    /** コミュニティのアルバム一覧 */
    list: (communityId: string) =>
        http<ListAlbumsResponse>(`/v1/communities/${communityId}/albums`),

    /** アルバム作成 */
    create: (communityId: string, data: CreateAlbumRequest) =>
        http<CreateAlbumResponse>(`/v1/communities/${communityId}/albums`, { method: 'POST', json: data }),

    /** アルバム内の写真一覧 */
    listPhotos: (albumId: string) =>
        http<ListAlbumPhotosResponse>(`/v1/albums/${albumId}/photos`),

    /** アルバムに写真追加 */
    addPhoto: (albumId: string, data: AddAlbumPhotoRequest) =>
        http<AddAlbumPhotoResponse>(`/v1/albums/${albumId}/photos`, { method: 'POST', json: data }),

    /** 写真削除 (Phase 3 REST 再設計: アルバム配下にネスト) */
    deletePhoto: (albumId: string, photoId: string) =>
        http<void>(`/v1/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }),
}
