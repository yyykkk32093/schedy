import { OAuthHttpClient } from '@/_sharedTech/http/OAuthHttpClient.js'
import type {
    IOAuthProviderClient,
    OAuthProfile,
} from '@/integration/oauth/IOAuthProviderClient.js'
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose'

export class AppleOAuthProviderClient implements IOAuthProviderClient {
    readonly provider = 'apple' as const

    private static readonly jwks = createRemoteJWKSet(
        new URL('https://appleid.apple.com/auth/keys')
    )

    constructor(private readonly http: OAuthHttpClient = new OAuthHttpClient()) { }

    async fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile> {
        const clientId = process.env.APPLE_CLIENT_ID
        const teamId = process.env.APPLE_TEAM_ID
        const keyId = process.env.APPLE_KEY_ID
        const privateKey = process.env.APPLE_PRIVATE_KEY
        const redirectUri = params.redirectUri ?? process.env.APPLE_REDIRECT_URI

        if (!clientId || !teamId || !keyId || !privateKey || !redirectUri) {
            throw new Error(
                'Missing APPLE_CLIENT_ID/APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY/APPLE_REDIRECT_URI'
            )
        }

        const clientSecret = await this.createClientSecret({
            clientId,
            teamId,
            keyId,
            privateKey,
        })

        const token = await this.http.postForm<{
            access_token: string
            expires_in: number
            token_type: string
            id_token: string
        }>('https://appleid.apple.com/auth/token', {
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        })

        const verified = await jwtVerify(token.id_token, AppleOAuthProviderClient.jwks, {
            issuer: 'https://appleid.apple.com',
            audience: clientId,
        })

        const sub = String(verified.payload.sub ?? '')
        if (!sub) {
            throw new Error('Apple id_token missing sub')
        }

        const email = typeof verified.payload.email === 'string' ? verified.payload.email : null

        return {
            provider: this.provider,
            providerUserId: sub,
            email,
            displayName: null,
        }
    }

    private async createClientSecret(params: {
        clientId: string
        teamId: string
        keyId: string
        privateKey: string
    }): Promise<string> {
        const now = Math.floor(Date.now() / 1000)
        const exp = now + 60 * 10

        const key = await importPKCS8(params.privateKey, 'ES256')

        return await new SignJWT({})
            .setProtectedHeader({ alg: 'ES256', kid: params.keyId })
            .setIssuer(params.teamId)
            .setSubject(params.clientId)
            .setAudience('https://appleid.apple.com')
            .setIssuedAt(now)
            .setExpirationTime(exp)
            .sign(key)
    }
}
