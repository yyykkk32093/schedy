import type { IAnnouncementBookmarkRepository } from '@/domains/announcement/domain/repository/IAnnouncementBookmarkRepository.js'
import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'
import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js'
import type { IAnnouncementReadRepository } from '@/domains/announcement/domain/repository/IAnnouncementReadRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { AnnouncementFeedItemDto } from './GetAnnouncementFeedUseCase.js'

/**
 * UBL-4: お知らせ検索 UseCase。
 * ユーザーが所属するコミュニティ内でキーワード検索。
 */
export class SearchAnnouncementsUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly announcementReadRepository: IAnnouncementReadRepository,
        private readonly membershipRepository: ICommunityMembershipRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
        private readonly commentRepository: IAnnouncementCommentRepository,
        private readonly bookmarkRepository: IAnnouncementBookmarkRepository,
    ) { }

    async execute(input: {
        userId: string
        keyword: string
        limit?: number
        offset?: number
    }): Promise<{ items: AnnouncementFeedItemDto[] }> {
        const limit = input.limit ?? 20
        const offset = input.offset ?? 0

        const memberships = await this.membershipRepository.findsByUserId(input.userId)
        const communityIds = memberships.map((m) => m.getCommunityId().getValue())

        if (communityIds.length === 0 || !input.keyword.trim()) {
            return { items: [] }
        }

        const rows = await this.announcementRepository.searchByKeyword(
            communityIds,
            input.keyword.trim(),
            { limit, offset },
        )

        const announcementIds = rows.map((r) => r.id)
        const [readIds, likeCounts, commentCounts, likedIds, bookmarkedIds] = await Promise.all([
            this.announcementReadRepository.findReadAnnouncementIds(input.userId, announcementIds),
            this.likeRepository.countByAnnouncementIds(announcementIds),
            this.commentRepository.countByAnnouncementIds(announcementIds),
            this.likeRepository.findLikedIds(input.userId, announcementIds),
            this.bookmarkRepository.findBookmarkedIds(input.userId, announcementIds),
        ])

        const readSet = new Set(readIds)
        const likedSet = new Set(likedIds)
        const bookmarkedSet = new Set(bookmarkedIds)

        return {
            items: rows.map((r) => ({
                id: r.id,
                communityId: r.communityId,
                authorId: r.authorId,
                authorName: r.authorName,
                authorAvatarUrl: r.authorAvatarUrl,
                communityName: r.communityName,
                communityLogoUrl: r.communityLogoUrl,
                title: r.title,
                content: r.content,
                isRead: readSet.has(r.id),
                isBookmarked: bookmarkedSet.has(r.id),
                createdAt: r.createdAt.toISOString(),
                likeCount: likeCounts.get(r.id) ?? 0,
                commentCount: commentCounts.get(r.id) ?? 0,
                isLiked: likedSet.has(r.id),
                attachments: r.attachments,
            })),
        }
    }
}
