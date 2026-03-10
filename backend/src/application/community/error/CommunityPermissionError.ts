import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class CommunityPermissionError extends HttpError {
    constructor(message = 'この操作を実行する権限がありません') {
        super({ statusCode: 403, code: 'COMMUNITY_PERMISSION_DENIED', message })
        this.name = 'CommunityPermissionError'
    }
}
