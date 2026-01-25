import type { AuthMethod } from '@/application/auth/model/AuthMethod.js'

export type OAuthProvider = Exclude<AuthMethod, 'password'>

export interface SignInOAuthUserInput {
    provider: OAuthProvider
    code: string
    redirectUri?: string
    ipAddress?: string
}

export interface SignInOAuthUserOutput {
    userId: string
    accessToken: string
}
