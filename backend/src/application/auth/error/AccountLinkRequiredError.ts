import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class AccountLinkRequiredError extends HttpError {
    constructor() {
        super({ statusCode: 409, code: 'ACCOUNT_LINK_REQUIRED' })
        this.name = 'AccountLinkRequiredError'
    }
}
