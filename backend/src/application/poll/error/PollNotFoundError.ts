export class PollNotFoundError extends Error {
    readonly code = 'POLL_NOT_FOUND'

    constructor(message: string = '投票が見つかりません') {
        super(message)
        this.name = 'PollNotFoundError'
    }
}
