import { PollOptionId } from '../valueObject/PollOptionId.js'
import { PollOptionText } from '../valueObject/PollOptionText.js'

/**
 * PollOption: 投票の選択肢
 */
export class PollOption {
    private constructor(
        private readonly id: PollOptionId,
        private readonly pollId: string,
        private readonly text: PollOptionText,
        private readonly sortOrder: number,
    ) { }

    static create(params: {
        id: PollOptionId
        pollId: string
        text: PollOptionText
        sortOrder: number
    }): PollOption {
        return new PollOption(params.id, params.pollId, params.text, params.sortOrder)
    }

    static reconstruct(params: {
        id: PollOptionId
        pollId: string
        text: PollOptionText
        sortOrder: number
    }): PollOption {
        return new PollOption(params.id, params.pollId, params.text, params.sortOrder)
    }

    getId(): PollOptionId { return this.id }
    getPollId(): string { return this.pollId }
    getText(): PollOptionText { return this.text }
    getSortOrder(): number { return this.sortOrder }
}
