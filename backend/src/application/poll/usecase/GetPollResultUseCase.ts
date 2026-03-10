import type { IPollRepository, PollResultRow } from '@/domains/poll/domain/repository/IPollRepository.js'
import type { IPollVoteRepository } from '@/domains/poll/domain/repository/IPollVoteRepository.js'
import { PollNotFoundError } from '../error/PollNotFoundError.js'

export class GetPollResultUseCase {
    constructor(
        private readonly pollRepository: IPollRepository,
        private readonly pollVoteRepository: IPollVoteRepository,
    ) { }

    async execute(input: {
        pollId: string
        userId: string
    }): Promise<PollResultRow & { myVotedOptionIds: string[] }> {
        const result = await this.pollRepository.findResultById(input.pollId)
        if (!result) throw new PollNotFoundError()

        const myVotedOptionIds = await this.pollVoteRepository.findUserVotes(input.pollId, input.userId)

        return { ...result, myVotedOptionIds }
    }
}
