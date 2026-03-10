export class PollPermissionError extends Error {
    readonly code = 'POLL_PERMISSION_ERROR'

    constructor(message: string = '投票に対する権限がありません') {
        super(message)
        this.name = 'PollPermissionError'
    }
}
