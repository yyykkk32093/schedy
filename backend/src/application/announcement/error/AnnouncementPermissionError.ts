import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class AnnouncementPermissionError extends HttpError {
    constructor(message = 'この操作を実行する権限がありません') {
        super({ statusCode: 403, code: 'ANNOUNCEMENT_PERMISSION_DENIED', message })
        this.name = 'AnnouncementPermissionError'
    }
}
