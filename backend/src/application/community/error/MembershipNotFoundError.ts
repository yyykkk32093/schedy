import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class MembershipNotFoundError extends HttpError {
    constructor() {
        super({ statusCode: 404, code: 'MEMBERSHIP_NOT_FOUND', message: 'メンバーシップが見つかりません' })
        this.name = 'MembershipNotFoundError'
    }
}
