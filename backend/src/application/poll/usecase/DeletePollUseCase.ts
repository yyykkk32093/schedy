import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IPollRepository } from '@/domains/poll/domain/repository/IPollRepository.js'
import { PollNotFoundError } from '../error/PollNotFoundError.js'
import { PollPermissionError } from '../error/PollPermissionError.js'

export class DeletePollUseCase {
    constructor(
        private readonly pollRepository: IPollRepository,
        private readonly membershipRepository: ICommunityMembershipRepository,
    ) { }

    async execute(input: {
        pollId: string
        userId: string
    }): Promise<void> {
        const poll = await this.pollRepository.findById(input.pollId)
        if (!poll) throw new PollNotFoundError()

        // 作成者本人 or OWNER/ADMIN のみ削除可能
        const isCreator = poll.getCreatedBy().getValue() === input.userId
        if (!isCreator) {
            const membership = await this.membershipRepository.findByCommunityAndUser(
                poll.getCommunityId().getValue(), input.userId,
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new PollPermissionError('投票の削除は作成者またはOWNER/ADMINのみ実行できます')
            }
        }

        poll.softDelete()
        await this.pollRepository.save(poll)
    }
}
