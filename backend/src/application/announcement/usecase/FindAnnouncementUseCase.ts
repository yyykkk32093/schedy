import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import { AnnouncementNotFoundError } from '../error/AnnouncementNotFoundError.js'

export class FindAnnouncementUseCase {
    constructor(
        private readonly announcementRepository: IAnnouncementRepository,
    ) { }

    async execute(input: { announcementId: string }): Promise<{
        id: string
        communityId: string
        authorId: string
        title: string
        content: string
        createdAt: string
        attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
    }> {
        const detail = await this.announcementRepository.findDetailById(input.announcementId)
        if (!detail) throw new AnnouncementNotFoundError()

        return {
            id: detail.id,
            communityId: detail.communityId,
            authorId: detail.authorId,
            title: detail.title,
            content: detail.content,
            createdAt: detail.createdAt.toISOString(),
            attachments: detail.attachments,
        }
    }
}
