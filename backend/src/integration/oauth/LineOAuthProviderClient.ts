import { OAuthHttpClient } from '@/_sharedTech/http/OAuthHttpClient.js';
import type {
    IOAuthProviderClient,
    OAuthProfile,
} from '@/integration/oauth/IOAuthProviderClient.js';

export class LineOAuthProviderClient implements IOAuthProviderClient {
    readonly provider = 'line' as const

    constructor(private readonly http: OAuthHttpClient = new OAuthHttpClient()) { }

    async fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile> {
        const clientId = process.env.LINE_CHANNEL_ID
        const clientSecret = process.env.LINE_CHANNEL_SECRET
        const redirectUri = params.redirectUri ?? process.env.LINE_REDIRECT_URI

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Missing LINE_CHANNEL_ID/LINE_CHANNEL_SECRET/LINE_REDIRECT_URI')
        }

        const token = await this.http.postForm<{
            access_token: string
            expires_in: number
            token_type: string
            scope: string
            id_token?: string
        }>('https://api.line.me/oauth2/v2.1/token', {
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        })

        const profile = await this.http.getJson<{
            userId: string
            displayName?: string
        }>('https://api.line.me/v2/profile', {
            Authorization: `Bearer ${token.access_token}`,
        })

        let email: string | null = null
        if (token.id_token) {
            const verified = await this.http.postForm<{
                sub: string
                email?: string
            }>('https://api.line.me/oauth2/v2.1/verify', {
                id_token: token.id_token,
                client_id: clientId,
            })

            email = verified.email ?? null

            if (verified.sub && verified.sub !== profile.userId) {
                throw new Error('LINE id_token sub mismatch')
            }
        }

        return {
            provider: this.provider,
            providerUserId: profile.userId,
            email,
            displayName: profile.displayName ?? null,
        }
    }
}
