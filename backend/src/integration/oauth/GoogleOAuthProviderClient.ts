import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js';
import { OAuthHttpClient } from '@/_sharedTech/http/OAuthHttpClient.js';
import type {
    IOAuthProviderClient,
    OAuthProfile,
} from '@/integration/oauth/IOAuthProviderClient.js';

export class GoogleOAuthProviderClient implements IOAuthProviderClient {
    readonly provider = 'google' as const

    constructor(private readonly http: OAuthHttpClient = new OAuthHttpClient()) { }

    async fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile> {
        const config = AppSecretsLoader.getOAuth().google
        const redirectUri = params.redirectUri ?? config.redirectUri

        const token = await this.http.postForm<{
            access_token: string
            expires_in: number
            scope: string
            token_type: string
            id_token?: string
        }>('https://oauth2.googleapis.com/token', {
            code: params.code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
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
