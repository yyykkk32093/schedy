import type { IAnnouncementReadRepository } from '@/domains/announcement/domain/repository/IAnnouncementReadRepository.js';
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js';
import { AnnouncementNotFoundError } from '../error/AnnouncementNotFoundError.js';

export class MarkAnnouncementAsReadUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
        private readonly announcementReadRepository: IAnnouncementReadRepository,
    ) { }

    async execute(input: { announcementId: string; userId: string }): Promise<void> {
        const announcement = await this.announcementRepository.findById(input.announcementId)
        if (!announcement) throw new AnnouncementNotFoundError()

        await this.announcementReadRepository.markAsRead(input.announcementId, input.userId)
    }
}
