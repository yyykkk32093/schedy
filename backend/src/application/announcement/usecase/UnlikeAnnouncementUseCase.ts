import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'

/**
 * いいね削除 UseCase（冪等）。
 * いいね未登録でも成功し、最終状態を返す。
 *
 * Phase 3 (REST 再設計): 旧 ToggleAnnouncementLikeUseCase を Like / Unlike に分割。
 */
export class UnlikeAnnouncementUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
    }): Promise<{ liked: false; likeCount: number }> {
        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement || announcement.isDeleted()) {
            throw new Error('お知らせが見つかりません')
        }

        await this.likeRepository.remove(input.announcementId, input.userId)
        const likeCount = await this.likeRepository.countByAnnouncementId(input.announcementId)

        return { liked: false, likeCount }
    }
}
