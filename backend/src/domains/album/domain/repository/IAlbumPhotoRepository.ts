export interface AlbumPhotoRow {
    id: string
    albumId: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
    uploadedBy: string
    createdAt: Date
}

export interface IAlbumPhotoRepository {
    create(params: { id: string; albumId: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number; uploadedBy: string }): Promise<void>
    findsByAlbumId(albumId: string): Promise<AlbumPhotoRow[]>
    findById(id: string): Promise<AlbumPhotoRow | null>
    delete(id: string): Promise<void>
}
