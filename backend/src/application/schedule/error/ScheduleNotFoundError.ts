import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class ScheduleNotFoundError extends HttpError {
    constructor() {
        super({ statusCode: 404, code: 'SCHEDULE_NOT_FOUND', message: 'スケジュールが見つかりません' })
        this.name = 'ScheduleNotFoundError'
    }
}
