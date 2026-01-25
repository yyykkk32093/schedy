import { OAuthHttpClient } from '@/_sharedTech/http/OAuthHttpClient.js';
import type {
    IOAuthProviderClient,
    OAuthProfile,
} from '@/integration/oauth/IOAuthProviderClient.js';

export class GoogleOAuthProviderClient implements IOAuthProviderClient {
    readonly provider = 'google' as const

    constructor(private readonly http: OAuthHttpClient = new OAuthHttpClient()) { }

    async fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile> {
        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        const redirectUri = params.redirectUri ?? process.env.GOOGLE_REDIRECT_URI

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI')
        }

        const token = await this.http.postForm<{
            access_token: string
            expires_in: number
            scope: string
            token_type: string
            id_token?: string
        }>('https://oauth2.googleapis.com/token', {
            code: params.code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        })

        const userinfo = await this.http.getJson<{
            sub: string
            email?: string
            email_verified?: boolean
            name?: string
        }>('https://openidconnect.googleapis.com/v1/userinfo', {
            Authorization: `Bearer ${token.access_token}`,
        })

        return {
            provider: this.provider,
            providerUserId: userinfo.sub,
            email: userinfo.email ?? null,
            displayName: userinfo.name ?? null,
        }
    }
}
