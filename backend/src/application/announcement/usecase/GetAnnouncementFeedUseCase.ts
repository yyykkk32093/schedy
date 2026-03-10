import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'
import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js'
import type { IAnnouncementReadRepository } from '@/domains/announcement/domain/repository/IAnnouncementReadRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'

export interface AnnouncementFeedItemDto {
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

export interface GetAnnouncementFeedOutput {
    items: AnnouncementFeedItemDto[]
    nextCursor: string | null
}

const DEFAULT_LIMIT = 20

export class GetAnnouncementFeedUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly announcementReadRepository: IAnnouncementReadRepository,
        private readonly membershipRepository: ICommunityMembershipRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
        private readonly commentRepository: IAnnouncementCommentRepository,
    ) { }

    async execute(input: {
        userId: string
        cursor?: string
        limit?: number
    }): Promise<GetAnnouncementFeedOutput> {
        const limit = input.limit ?? DEFAULT_LIMIT

        // 1. ユーザーが所属するコミュニティID一覧を取得
        const memberships = await this.membershipRepository.findsByUserId(input.userId)
        const communityIds = memberships.map((m) => m.getCommunityId().getValue())

        if (communityIds.length === 0) {
            return { items: [], nextCursor: null }
        }

        // 2. 横断的にアナウンスメントを取得（limit+1で次ページ有無を判定）
        const rows = await this.announcementRepository.findFeedByCommunityIds(
            communityIds,
            { cursor: input.cursor, limit: limit + 1 },
        )

        const hasMore = rows.length > limit
        const feedRows = hasMore ? rows.slice(0, limit) : rows

        // 3. 既読状態・いいね数・コメント数・いいね済みを一括取得
        const announcementIds = feedRows.map((r) => r.id)
        const [readIds, likeCounts, commentCounts, likedIds] = await Promise.all([
            this.announcementReadRepository.findReadAnnouncementIds(input.userId, announcementIds),
            this.likeRepository.countByAnnouncementIds(announcementIds),
            this.commentRepository.countByAnnouncementIds(announcementIds),
            this.likeRepository.findLikedIds(input.userId, announcementIds),
        ])

        const readSet = new Set(readIds)
        const likedSet = new Set(likedIds)

        // 4. DTOに変換
        const items: AnnouncementFeedItemDto[] = feedRows.map((r) => ({
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
        }))

        const nextCursor = hasMore ? feedRows[feedRows.length - 1].id : null

        return { items, nextCursor }
    }
}
