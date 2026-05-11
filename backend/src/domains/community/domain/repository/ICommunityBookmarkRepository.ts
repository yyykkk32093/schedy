export type BookmarkedCommunityListItem = {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    joinMethod: string
    isPublic: boolean
}

export interface ICommunityBookmarkRepository {
    /** 指定ユーザーのブックマーク済 communityId 一覧 */
    findCommunityIdsByUserId(userId: string): Promise<string[]>
    /** ブックマーク済コミュニティ一覧（コミュニティ詳細付き） */
    findBookmarkedCommunitiesByUserId(userId: string): Promise<BookmarkedCommunityListItem[]>
    /** 追加（既存なら no-op） */
    add(communityId: string, userId: string): Promise<void>
    /** 削除（無ければ no-op） */
    remove(communityId: string, userId: string): Promise<void>
}
