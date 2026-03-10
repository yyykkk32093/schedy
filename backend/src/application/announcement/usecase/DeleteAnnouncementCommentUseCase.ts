import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'

/**
 * コメント削除 UseCase。
 * 本人のみ削除可能。
 */
export class DeleteAnnouncementCommentUseCase {
    constructor(
        private readonly commentRepository: IAnnouncementCommentRepository,
    ) { }

    async execute(input: {
        commentId: string
        userId: string
    }): Promise<void> {
        const comment = await this.commentRepository.findById(input.commentId)
        if (!comment) {
            throw new Error('コメントが見つかりません')
        }
        if (comment.userId !== input.userId) {
            throw new Error('他のユーザーのコメントは削除できません')
        }
        await this.commentRepository.delete(input.commentId)
    }
}
