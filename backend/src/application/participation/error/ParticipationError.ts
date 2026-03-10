import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class ParticipationError extends HttpError {
    constructor(message: string, code = 'PARTICIPATION_ERROR') {
        super({ statusCode: 409, code, message })
        this.name = 'ParticipationError'
    }
}
