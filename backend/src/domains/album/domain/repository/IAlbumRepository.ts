
export interface AlbumRow {
    id: string
    communityId: string
    title: string
    description: string | null
    createdBy: string
    createdAt: Date
    photoCount: number
    coverUrl: string | null
}

export interface IAlbumRepository {
    create(params: { id: string; communityId: string; title: string; description?: string; createdBy: string }): Promise<void>
    findById(id: string): Promise<AlbumRow | null>
    findsByCommunityId(communityId: string): Promise<AlbumRow[]>
    delete(id: string): Promise<void>
}
