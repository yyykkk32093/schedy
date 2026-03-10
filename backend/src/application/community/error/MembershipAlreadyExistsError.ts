import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class MembershipAlreadyExistsError extends HttpError {
    constructor() {
        super({ statusCode: 409, code: 'MEMBERSHIP_ALREADY_EXISTS', message: 'すでにメンバーとして参加しています' })
        this.name = 'MembershipAlreadyExistsError'
    }
}
