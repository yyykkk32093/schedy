import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class ActivityPermissionError extends HttpError {
    constructor(message = 'この操作を実行する権限がありません') {
        super({ statusCode: 403, code: 'ACTIVITY_PERMISSION_DENIED', message })
        this.name = 'ActivityPermissionError'
    }
}
