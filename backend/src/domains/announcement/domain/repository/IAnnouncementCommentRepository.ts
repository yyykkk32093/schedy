export interface AnnouncementCommentRow {
    id: string
    announcementId: string
    userId: string
    content: string
    createdAt: Date
    userName: string | null
    userAvatarUrl: string | null
}

export interface IAnnouncementCommentRepository {
    create(params: { id: string; announcementId: string; userId: string; content: string }): Promise<void>
    delete(id: string): Promise<void>
    findById(id: string): Promise<{ id: string; announcementId: string; userId: string } | null>
    findsByAnnouncementId(announcementId: string, options?: { cursor?: string; limit?: number }): Promise<AnnouncementCommentRow[]>
    countByAnnouncementId(announcementId: string): Promise<number>
    countByAnnouncementIds(announcementIds: string[]): Promise<Map<string, number>>
}
