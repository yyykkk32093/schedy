import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class WaitlistError extends HttpError {
    constructor(message: string, code = 'WAITLIST_ERROR') {
        super({ statusCode: 409, code, message })
        this.name = 'WaitlistError'
    }
}
