import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { MembershipNotFoundError } from '../error/MembershipNotFoundError.js'
import { propagateLeaveToChildren } from '../helper/membershipPropagation.js'

export type LeaveCommunityTxRepositories = {
    membership: ICommunityMembershipRepository
    community: ICommunityRepository
    schedule: IScheduleRepository
    participation: IParticipationRepository
    payment: IPaymentRepository
    waitlist: IWaitlistEntryRepository
}

export class LeaveCommunityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<LeaveCommunityTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
        /** 子コミュニティからも同時に脱退するか（undefined の場合は従来通り自動脱退） */
        cascadeToChildren?: boolean
    }): Promise<void> {
        // デフォルトは従来互換: 自動で子からも脱退
        const shouldCascade = input.cascadeToChildren !== false

        await this.unitOfWork.run(async (repos, txEventPublisher) => {
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive()) {
                throw new MembershipNotFoundError()
            }

            // OWNER 脱退チェック + MemberLeftEvent 発行はドメイン層で実施
            membership.leave()
            await repos.membership.save(membership)

            // ユーザーが選択した場合のみ子コミュニティからも脱退
            if (shouldCascade) {
                await propagateLeaveToChildren(repos, input.communityId, input.userId)
            }

            // TX内ドメインイベントを発行 → Subscriber が連鎖処理を実行
            await txEventPublisher?.publishAll(membership.pullDomainEvents())
        })
    }
}
