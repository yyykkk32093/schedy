export class DMParticipantNotFoundError extends Error {
    constructor(public readonly channelId: string, public readonly userId: string) {
        super(`DM participant not found: channelId=${channelId}, userId=${userId}`)
        this.name = 'DMParticipantNotFoundError'
    }
}
