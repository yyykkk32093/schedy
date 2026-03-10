import type { IPollRepository, PollResultRow } from '@/domains/poll/domain/repository/IPollRepository.js'
import type { IPollVoteRepository } from '@/domains/poll/domain/repository/IPollVoteRepository.js'

export class ListPollsUseCase {
    constructor(
        private readonly pollRepository: IPollRepository,
        private readonly pollVoteRepository: IPollVoteRepository,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
    }): Promise<Array<PollResultRow & { myVotedOptionIds: string[] }>> {
        const polls = await this.pollRepository.findsByCommunityId(input.communityId)

        const results: Array<PollResultRow & { myVotedOptionIds: string[] }> = []
        for (const poll of polls) {
            const result = await this.pollRepository.findResultById(poll.getId().getValue())
            if (!result) continue
            const myVotedOptionIds = await this.pollVoteRepository.findUserVotes(
                poll.getId().getValue(), input.userId,
            )
            results.push({ ...result, myVotedOptionIds })
        }

        return results
    }
}
