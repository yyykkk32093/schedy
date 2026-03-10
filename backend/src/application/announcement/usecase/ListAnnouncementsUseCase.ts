import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js';
import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js';
import type { IAnnouncementReadRepository } from '@/domains/announcement/domain/repository/IAnnouncementReadRepository.js';
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js';

export interface CommunityAnnouncementItemDto {
    id: string
    communityId: string
    authorId: string
    authorName: string | null
    authorAvatarUrl: string | null
    communityName: string
    communityLogoUrl: string | null
    title: string
    content: string
    isRead: boolean
    createdAt: string
    likeCount: number
    commentCount: number
    isLiked: boolean
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

export class ListAnnouncementsUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly announcementReadRepository: IAnnouncementReadRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
        private readonly commentRepository: IAnnouncementCommentRepository,
    ) { }

    async execute(input: { communityId: string; userId: string }): Promise<{
        announcements: CommunityAnnouncementItemDto[]
    }> {
        // フィード用リッチ行をコミュニティ単位で取得（上限100件）
        const rows = await this.announcementRepository.findFeedByCommunityIds(
            [input.communityId],
            { limit: 100 },
        )

        if (rows.length === 0) {
            return { announcements: [] }
        }

        const ids = rows.map((r) => r.id)

        // ソーシャルデータを一括取得（GetAnnouncementFeedUseCase と同パターン）
        const [readIds, likeCounts, commentCounts, likedIds] = await Promise.all([
            this.announcementReadRepository.findReadAnnouncementIds(input.userId, ids),
            this.likeRepository.countByAnnouncementIds(ids),
            this.commentRepository.countByAnnouncementIds(ids),
            this.likeRepository.findLikedIds(input.userId, ids),
        ])

        const readSet = new Set(readIds)
        const likedSet = new Set(likedIds)

        return {
            announcements: rows.map((r) => ({
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
                createdAt: r.createdAt.toISOString(),
                likeCount: likeCounts.get(r.id) ?? 0,
                commentCount: commentCounts.get(r.id) ?? 0,
                isLiked: likedSet.has(r.id),
                attachments: r.attachments,
            })),
        }
    }
}
