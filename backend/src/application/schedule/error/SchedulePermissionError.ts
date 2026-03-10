import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class SchedulePermissionError extends HttpError {
    constructor(message = 'この操作を実行する権限がありません') {
        super({ statusCode: 403, code: 'SCHEDULE_PERMISSION_DENIED', message })
        this.name = 'SchedulePermissionError'
    }
}
