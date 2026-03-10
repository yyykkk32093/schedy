import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class CommunityNotFoundError extends HttpError {
    constructor() {
        super({ statusCode: 404, code: 'COMMUNITY_NOT_FOUND', message: 'コミュニティが見つかりません' })
        this.name = 'CommunityNotFoundError'
    }
}
