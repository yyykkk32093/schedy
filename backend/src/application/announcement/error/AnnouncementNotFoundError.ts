import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class AnnouncementNotFoundError extends HttpError {
    constructor() {
        super({ statusCode: 404, code: 'ANNOUNCEMENT_NOT_FOUND', message: 'お知らせが見つかりません' })
        this.name = 'AnnouncementNotFoundError'
    }
}
