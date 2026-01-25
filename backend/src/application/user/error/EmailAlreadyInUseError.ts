import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class EmailAlreadyInUseError extends HttpError {
    constructor() {
        super({ statusCode: 409, code: 'EMAIL_ALREADY_IN_USE' })
        this.name = 'EmailAlreadyInUseError'
    }
}
