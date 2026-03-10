export interface IAnnouncementBookmarkRepository {
    /** ブックマーク toggle: あれば削除、なければ作成。returns 最終状態 */
    toggle(announcementId: string, userId: string): Promise<{ bookmarked: boolean }>
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
