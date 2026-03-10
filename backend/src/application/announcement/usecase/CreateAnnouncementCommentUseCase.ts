import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IAnnouncementCommentRepository } from '@/domains/announcement/domain/repository/IAnnouncementCommentRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'

/**
 * コメント作成 UseCase。
 */
export class CreateAnnouncementCommentUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly commentRepository: IAnnouncementCommentRepository,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
        content: string
    }): Promise<{ commentId: string }> {
        if (!input.content.trim()) {
            throw new Error('コメント内容は必須です')
        }
        if (input.content.length > 2000) {
            throw new Error('コメントは2000文字以内で入力してください')
        }

        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement) {
            throw new Error('お知らせが見つかりません')
        }

        const id = this.idGenerator.generate()
        await this.commentRepository.create({
            id,
            announcementId: input.announcementId,
            userId: input.userId,
            content: input.content.trim(),
        })

        return { commentId: id }
    }
}
