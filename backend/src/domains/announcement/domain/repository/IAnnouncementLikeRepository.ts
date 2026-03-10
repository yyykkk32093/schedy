export interface IAnnouncementLikeRepository {
    /** いいね toggle: あれば削除、なければ作成。returns 最終状態 */
    toggle(announcementId: string, userId: string): Promise<{ liked: boolean }>
    /** いいね数を取得 */
    countByAnnouncementId(announcementId: string): Promise<number>
    /** 一括: announcementIds に対する各いいね数 */
    countByAnnouncementIds(announcementIds: string[]): Promise<Map<string, number>>
    /** userId が「いいね」済みかどうか */
    isLiked(announcementId: string, userId: string): Promise<boolean>
    /** 一括: userId がいいね済みの announcementId 集合 */
    findLikedIds(userId: string, announcementIds: string[]): Promise<string[]>
}
