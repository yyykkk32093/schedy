import type { OAuthProvider } from '@/shared/types/api'

/**
 * OAuth プロバイダーの認可URL設定
 *
 * 各プロバイダーの認可エンドポイントにリダイレクトし、
 * ユーザーが認可した後にコールバックURLに code が返される。
 *
 * NOTE: client_id は本番環境では環境変数から取得する
 *       現在はローカル開発用のダミー値
 */

interface OAuthConfig {
    provider: OAuthProvider
    label: string
    authorizationUrl: string
    clientIdEnvKey: string
    scopes: string[]
    redirectPath: string
}

const oauthConfigs: Record<OAuthProvider, OAuthConfig> = {
    google: {
        provider: 'google',
        label: 'Google',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientIdEnvKey: 'VITE_GOOGLE_CLIENT_ID',
        scopes: ['openid', 'email', 'profile'],
        redirectPath: '/auth/callback/google',
    },
    line: {
        provider: 'line',
        label: 'LINE',
        authorizationUrl: 'https://access.line.me/oauth2/v2.1/authorize',
        clientIdEnvKey: 'VITE_LINE_CHANNEL_ID',
        scopes: ['profile', 'openid', 'email'],
        redirectPath: '/auth/callback/line',
    },
    apple: {
        provider: 'apple',
        label: 'Apple',
        authorizationUrl: 'https://appleid.apple.com/auth/authorize',
        clientIdEnvKey: 'VITE_APPLE_CLIENT_ID',
        scopes: ['name', 'email'],
        redirectPath: '/auth/callback/apple',
    },
}

/**
 * OAuthプロバイダーの認可URLを生成してリダイレクトする
 */
export function redirectToOAuthProvider(provider: OAuthProvider): void {
    const config = oauthConfigs[provider]
    const clientId = import.meta.env[config.clientIdEnvKey] || ''
    const redirectUri = `${window.location.origin}${config.redirectPath}`
    const state = generateState()

    // CSRF対策: stateをsessionStorageに保存
    sessionStorage.setItem('oauth_state', state)

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes.join(' '),
        state,
    })

    // LINE固有のパラメータ
    if (provider === 'line') {
        params.set('bot_prompt', 'normal')
    }

    // Apple固有のパラメータ
    if (provider === 'apple') {
        params.set('response_mode', 'query')
    }

    window.location.href = `${config.authorizationUrl}?${params.toString()}`
}

/**
 * CSRF対策用のランダムstate生成
 */
function generateState(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export { oauthConfigs }
