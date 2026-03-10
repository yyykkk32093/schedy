import type { IAnnouncementLikeRepository } from '@/domains/announcement/domain/repository/IAnnouncementLikeRepository.js';
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js';

/**
 * いいね Toggle UseCase。
 * 既にいいね済みなら削除、なければ追加。
 */
export class ToggleAnnouncementLikeUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly likeRepository: IAnnouncementLikeRepository,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
    }): Promise<{ liked: boolean; likeCount: number }> {
        // お知らせ存在チェック
        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement) {
            throw new Error('お知らせが見つかりません')
        }

        const { liked } = await this.likeRepository.toggle(input.announcementId, input.userId)
        const likeCount = await this.likeRepository.countByAnnouncementId(input.announcementId)

        return { liked, likeCount }
    }
}
