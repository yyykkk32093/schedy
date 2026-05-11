export interface IAnnouncementLikeRepository {
    /** いいね追加（既に存在する場合は何もせず冪等に true を返す） */
    add(announcementId: string, userId: string): Promise<void>
    /** いいね削除（存在しない場合は何もせず冪等に成功する） */
    remove(announcementId: string, userId: string): Promise<void>
    /** いいね数を取得 */
    countByAnnouncementId(announcementId: string): Promise<number>
    /** 一括: announcementIds に対する各いいね数 */
    countByAnnouncementIds(announcementIds: string[]): Promise<Map<string, number>>
    /** userId が「いいね」済みかどうか */
    isLiked(announcementId: string, userId: string): Promise<boolean>
    /** 一括: userId がいいね済みの announcementId 集合 */
    findLikedIds(userId: string, announcementIds: string[]): Promise<string[]>
}
