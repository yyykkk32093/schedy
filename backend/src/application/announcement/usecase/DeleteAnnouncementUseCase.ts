import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { AnnouncementNotFoundError } from '../error/AnnouncementNotFoundError.js'
import { AnnouncementPermissionError } from '../error/AnnouncementPermissionError.js'

export type DeleteAnnouncementTxRepositories = {
    announcement: IAnnouncementRepository
    membership: ICommunityMembershipRepository
}

export class DeleteAnnouncementUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<DeleteAnnouncementTxRepositories>,
    ) { }

    async execute(input: {
        announcementId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const announcement = await repos.announcement.findById(input.announcementId)
            if (!announcement) throw new AnnouncementNotFoundError()

            const membership = await repos.membership.findByCommunityAndUser(
                announcement.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new AnnouncementPermissionError('お知らせの削除はOWNERまたはADMINのみ実行できます')
            }

            announcement.softDelete()
            await repos.announcement.save(announcement)
        })
    }
}
