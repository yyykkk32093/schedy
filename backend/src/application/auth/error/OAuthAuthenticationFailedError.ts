import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'

export class OAuthAuthenticationFailedError extends HttpError {
    constructor(params?: { code?: string }) {
        super({ statusCode: 401, code: params?.code ?? 'OAUTH_AUTHENTICATION_FAILED' })
        this.name = 'OAuthAuthenticationFailedError'
    }
}
