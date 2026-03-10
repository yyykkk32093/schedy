import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'

export interface CommentDto {
    id: string
    announcementId: string
    userId: string
    userName: string | null
    userAvatarUrl: string | null
    content: string
    createdAt: string
}

/**
 * コメント一覧取得 UseCase。
 */
export class ListAnnouncementCommentsUseCase {
    constructor(
        private readonly commentRepository: IAnnouncementCommentRepository,
    ) { }

    async execute(input: {
        announcementId: string
        cursor?: string
        limit?: number
    }): Promise<{ comments: CommentDto[]; nextCursor: string | null }> {
        const limit = input.limit ?? 50
        const rows = await this.commentRepository.findsByAnnouncementId(
            input.announcementId,
            { cursor: input.cursor, limit: limit + 1 },
        )

        const hasMore = rows.length > limit
        const data = hasMore ? rows.slice(0, limit) : rows

        return {
            comments: data.map((r) => ({
                id: r.id,
                announcementId: r.announcementId,
                userId: r.userId,
                userName: r.userName,
                userAvatarUrl: r.userAvatarUrl,
                content: r.content,
                createdAt: r.createdAt.toISOString(),
            })),
            nextCursor: hasMore ? data[data.length - 1].id : null,
        }
    }
}
