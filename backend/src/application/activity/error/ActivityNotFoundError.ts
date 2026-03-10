import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class ActivityNotFoundError extends HttpError {
    constructor() {
        super({ statusCode: 404, code: 'ACTIVITY_NOT_FOUND', message: 'アクティビティが見つかりません' })
        this.name = 'ActivityNotFoundError'
    }
}
