import type { IAnnouncementBookmarkRepository } from '@/domains/announcement/domain/repository/IAnnouncementBookmarkRepository.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'

/**
 * Phase 3 (3-1): お知らせブックマーク Toggle
 */
export class ToggleAnnouncementBookmarkUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly bookmarkRepository: IAnnouncementBookmarkRepository,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
    }): Promise<{ bookmarked: boolean }> {
        // お知らせの存在確認
        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement || announcement.isDeleted()) {
            throw new Error('お知らせが見つかりません')
        }

        return this.bookmarkRepository.toggle(input.announcementId, input.userId)
    }
}
