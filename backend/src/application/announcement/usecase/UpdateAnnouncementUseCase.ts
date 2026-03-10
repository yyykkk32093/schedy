import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { AnnouncementContent } from '@/domains/announcement/domain/model/valueObject/AnnouncementContent.js'
import { AnnouncementTitle } from '@/domains/announcement/domain/model/valueObject/AnnouncementTitle.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { AnnouncementNotFoundError } from '../error/AnnouncementNotFoundError.js'
import { AnnouncementPermissionError } from '../error/AnnouncementPermissionError.js'

export type UpdateAnnouncementTxRepositories = {
    announcement: IAnnouncementRepository
    membership: ICommunityMembershipRepository
}

/**
 * Phase 3 (3-2): お知らせ編集 UseCase
 * OWNER/ADMIN のみ実行可能
 */
export class UpdateAnnouncementUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateAnnouncementTxRepositories>,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
        title: string
        content: string
    }): Promise<{ id: string }> {
        return this.unitOfWork.run(async (repos) => {
            const announcement = await repos.announcement.findById(input.announcementId)
            if (!announcement) throw new AnnouncementNotFoundError()

            // 権限チェック: OWNER or ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                announcement.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new AnnouncementPermissionError('お知らせの編集はOWNERまたはADMINのみ実行できます')
            }

            announcement.updateTitle(AnnouncementTitle.create(input.title))
            announcement.updateContent(AnnouncementContent.create(input.content))
            await repos.announcement.save(announcement)

            return { id: announcement.getId().getValue() }
        })
    }
}
