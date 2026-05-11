import type { IAnnouncementBookmarkRepository } from '@/domains/announcement/domain/repository/IAnnouncementBookmarkRepository.js';
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js';

/**
 * お知らせブックマーク削除（冪等）。
 *
 * Phase 3 (REST 再設計): 旧 ToggleAnnouncementBookmarkUseCase を分割。
 */
export class UnbookmarkAnnouncementUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly bookmarkRepository: IAnnouncementBookmarkRepository,
    ) { }

    async execute(input: { announcementId: string; userId: string }): Promise<{ bookmarked: false }> {
        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement || announcement.isDeleted()) {
            throw new Error('お知らせが見つかりません')
        }

        await this.bookmarkRepository.remove(input.announcementId, input.userId)
        return { bookmarked: false }
    }
}
