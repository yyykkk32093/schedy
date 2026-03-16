import type { IAnnouncementBookmarkRepository } from '@/domains/announcement/domain/repository/IAnnouncementBookmarkRepository.js'
import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'
import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js'
import type { IAnnouncementReadRepository } from '@/domains/announcement/domain/repository/IAnnouncementReadRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import { AnnouncementNotFoundError } from '../error/AnnouncementNotFoundError.js'

export interface AnnouncementDetailDto {
    id: string
    communityId: string
    activityId: string | null
    authorId: string
    title: string
    content: string
    createdAt: string
    isRead: boolean
    isLiked: boolean
    isBookmarked: boolean
    likeCount: number
    commentCount: number
    readCount: number
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
    scheduleInfo: { scheduleId: string; date: string; startTime: string; endTime: string } | null
}

export class FindAnnouncementUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly announcementReadRepository: IAnnouncementReadRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
        private readonly commentRepository: IAnnouncementCommentRepository,
        private readonly bookmarkRepository: IAnnouncementBookmarkRepository,
    ) { }

    async execute(input: { announcementId: string; userId: string }): Promise<AnnouncementDetailDto> {
        const detail = await this.announcementRepository.findDetailById(input.announcementId)
        if (!detail) throw new AnnouncementNotFoundError()

        const ids = [detail.id]

        const [readIds, likeCounts, commentCounts, likedIds, bookmarkedIds, readCounts] = await Promise.all([
            this.announcementReadRepository.findReadAnnouncementIds(input.userId, ids),
            this.likeRepository.countByAnnouncementIds(ids),
            this.commentRepository.countByAnnouncementIds(ids),
            this.likeRepository.findLikedIds(input.userId, ids),
            this.bookmarkRepository.findBookmarkedIds(input.userId, ids),
            this.announcementReadRepository.countByAnnouncementIds(ids),
        ])

        return {
            id: detail.id,
            communityId: detail.communityId,
            activityId: detail.activityId,
            authorId: detail.authorId,
            title: detail.title,
            content: detail.content,
            createdAt: detail.createdAt.toISOString(),
            isRead: readIds.includes(detail.id),
            isLiked: likedIds.includes(detail.id),
            isBookmarked: bookmarkedIds.includes(detail.id),
            likeCount: likeCounts.get(detail.id) ?? 0,
            commentCount: commentCounts.get(detail.id) ?? 0,
            readCount: readCounts.get(detail.id) ?? 0,
            attachments: detail.attachments,
            scheduleInfo: detail.scheduleInfo,
        }
    }
}
