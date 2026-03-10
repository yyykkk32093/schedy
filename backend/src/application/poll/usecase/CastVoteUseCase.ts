import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IPollRepository } from '@/domains/poll/domain/repository/IPollRepository.js'
import type { IPollVoteRepository } from '@/domains/poll/domain/repository/IPollVoteRepository.js'
import { PollNotFoundError } from '../error/PollNotFoundError.js'

export class CastVoteUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly pollRepository: IPollRepository,
        private readonly pollVoteRepository: IPollVoteRepository,
        private readonly membershipRepository: ICommunityMembershipRepository,
    ) { }

    async execute(input: {
        pollId: string
        optionIds: string[]
        userId: string
    }): Promise<{ votedOptionIds: string[] }> {
        const poll = await this.pollRepository.findById(input.pollId)
        if (!poll) throw new PollNotFoundError()

        // コミュニティメンバーか確認
        const membership = await this.membershipRepository.findByCommunityAndUser(
            poll.getCommunityId().getValue(), input.userId,
        )
        if (!membership || !membership.isActive()) {
            throw new DomainValidationError('コミュニティメンバーのみ投票できます', 'NOT_COMMUNITY_MEMBER')
        }

        // 期限チェック
        if (poll.isExpired()) {
            throw new DomainValidationError('投票の期限が過ぎています', 'POLL_EXPIRED')
        }

        // 単一選択の場合は1つだけ
        if (!poll.getIsMultipleChoice() && input.optionIds.length > 1) {
            throw new DomainValidationError('単一選択の投票では1つだけ選択してください', 'SINGLE_CHOICE_VIOLATION')
        }

        // optionIds が Poll に属するか確認
        const validOptionIds = new Set(poll.getOptions().map((o) => o.getId().getValue()))
        for (const optionId of input.optionIds) {
            if (!validOptionIds.has(optionId)) {
                throw new DomainValidationError('無効な選択肢です', 'INVALID_POLL_OPTION')
            }
        }

        // 投票実行
        for (const optionId of input.optionIds) {
            await this.pollVoteRepository.castVote({
                id: this.idGenerator.generate(),
                pollOptionId: optionId,
                userId: input.userId,
                isMultipleChoice: poll.getIsMultipleChoice(),
                pollId: input.pollId,
            })
        }

        // 投票後の状態を返す
        const votedOptionIds = await this.pollVoteRepository.findUserVotes(input.pollId, input.userId)
        return { votedOptionIds }
    }
}
