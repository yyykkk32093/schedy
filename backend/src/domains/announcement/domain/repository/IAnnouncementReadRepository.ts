export interface IAnnouncementReadRepository {
    markAsRead(announcementId: string, userId: string): Promise<void>
    findReadUserIds(announcementId: string): Promise<string[]>
    findReadAnnouncementIds(userId: string, announcementIds: string[]): Promise<string[]>
}
