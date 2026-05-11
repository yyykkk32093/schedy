export interface IAnnouncementBookmarkRepository {
    /** ブックマーク追加（既に存在する場合は何もせず冪等に成功する） */
    add(announcementId: string, userId: string): Promise<void>
    /** ブックマーク削除（存在しない場合は何もせず冪等に成功する） */
    remove(announcementId: string, userId: string): Promise<void>
    /** userId がブックマーク済みかどうか */
    isBookmarked(announcementId: string, userId: string): Promise<boolean>
    /** 一括: userId がブックマーク済みの announcementId 集合 */
    findBookmarkedIds(userId: string, announcementIds: string[]): Promise<string[]>
    /** userId がブックマークしている announcementId 一覧（ページネーション） */
    findBookmarkedAnnouncementIds(
        userId: string,
        options: { cursor?: string; limit: number },
    ): Promise<string[]>
}
