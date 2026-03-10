import type { Announcement } from '../model/entity/Announcement.js'

/** 詳細取得用（attachments 付き） */
export interface AnnouncementDetailRow {
    id: string
    communityId: string
    authorId: string
    title: string
    content: string
    createdAt: Date
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

/** フィード取得用の生データ行（Prisma JOIN結果をそのまま返す） */
export interface AnnouncementFeedRow {
    id: string
    communityId: string
    authorId: string
    title: string
    content: string
    createdAt: Date
    authorName: string | null
    authorAvatarUrl: string | null
    communityName: string
    communityLogoUrl: string | null
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

export interface IAnnouncementRepository {
    findById(id: string): Promise<Announcement | null>
    findDetailById(id: string): Promise<AnnouncementDetailRow | null>
    findsByCommunityId(communityId: string): Promise<Announcement[]>
    save(
        announcement: Announcement,
        attachments?: Array<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number }>,
    ): Promise<void>

    /**
     * 複数コミュニティを横断してアナウンスメントを取得（フィード用）
     * createdAt DESC + カーソルページネーション
     */
    findFeedByCommunityIds(
        communityIds: string[],
        options: { cursor?: string; limit: number },
    ): Promise<AnnouncementFeedRow[]>

    /** UBL-4: テキスト検索 */
    searchByKeyword(
        communityIds: string[],
        keyword: string,
        options: { limit: number; offset: number },
    ): Promise<AnnouncementFeedRow[]>
}
