/**
 * AppSecretsLoader
 *
 * アプリケーション全体のシークレット（OAuth、Database等）を一元管理する。
 *
 * - production 環境: AWS Secrets Manager から取得
 * - local/test 環境: 環境変数から取得
 *
 * 起動時に一度だけ load() を呼び、以降は getOAuth() / getDatabase() でキャッシュから取得する。
 */

import { logger } from '@/_sharedTech/logger/logger.js'
import { AwsSecretsManagerProvider } from './secrets/AwsSecretsManagerProvider.js'
import { loadApplePrivateKey, requireEnv } from './secrets/EnvSecretsProvider.js'
import type { ISecretsProvider } from './secrets/ISecretsProvider.js'

// ============================================
// 型定義: OAuth
// ============================================

export interface GoogleOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
}

export interface LineOAuthConfig {
    channelId: string
    channelSecret: string
    redirectUri: string
}

export interface AppleOAuthConfig {
    clientId: string
    teamId: string
    keyId: string
    privateKey: string
    redirectUri: string
}

export interface OAuthConfig {
    google: GoogleOAuthConfig
    line: LineOAuthConfig
    apple: AppleOAuthConfig
}

// ============================================
// 型定義: Database
// ============================================

export interface DatabaseConfig {
    url: string
}

// ============================================
// 型定義: 全シークレット
// ============================================

export interface AppSecrets {
    oauth: OAuthConfig
    database: DatabaseConfig
}

// ============================================
// Secrets Manager 用の型（JSON構造）
// ============================================

interface SecretsManagerPayload {
    oauth: {
        google: {
            clientId: string
            clientSecret: string
            redirectUri: string
        }
        line: {
            channelId: string
            channelSecret: string
            redirectUri: string
        }
        apple: {
            clientId: string
            teamId: string
            keyId: string
            privateKey: string
            redirectUri: string
        }
    }
    database: {
        url: string
    }
}

// ============================================
// Secret Keys
// ============================================

const SECRET_KEY_APP = 'schedy/secrets'

// ============================================
// Loader 本体
// ============================================

class AppSecretsLoaderImpl {
    private cache: AppSecrets | null = null
    private loadPromise: Promise<AppSecrets> | null = null
    private provider: ISecretsProvider | null = null

    /**
     * 設定をロードする（起動時に1回だけ呼ぶ）
     * 並行呼び出しされても1回だけロードする
     */
    async load(): Promise<AppSecrets> {
        if (this.cache) {
            return this.cache
        }

        if (this.loadPromise) {
            return this.loadPromise
        }

        this.loadPromise = this.doLoad()
        this.cache = await this.loadPromise
        this.loadPromise = null

        return this.cache
    }

    /**
     * OAuth 設定を取得（load() 後に使用）
     */
    getOAuth(): OAuthConfig {
        if (!this.cache) {
            throw new Error(
                'AppSecrets is not loaded. Call AppSecretsLoader.load() at application startup.'
            )
        }
        return this.cache.oauth
    }

    /**
     * Database 設定を取得（load() 後に使用）
     */
    getDatabase(): DatabaseConfig {
        if (!this.cache) {
            throw new Error(
                'AppSecrets is not loaded. Call AppSecretsLoader.load() at application startup.'
            )
        }
        return this.cache.database
    }

    /**
     * キャッシュをクリアする（テスト用）
     */
    clearCache(): void {
        this.cache = null
        this.loadPromise = null
        this.provider = null
    }

    /**
     * テスト用: キャッシュを直接設定する
     */
    setCache(secrets: AppSecrets): void {
        this.cache = secrets
    }

    /**
     * テスト用: OAuth キャッシュのみ設定する（後方互換）
     */
    setOAuthCache(oauth: OAuthConfig): void {
        if (!this.cache) {
            this.cache = {
                oauth,
                database: { url: process.env.DATABASE_URL ?? '' },
            }
        } else {
            this.cache.oauth = oauth
        }
    }

    /**
     * テスト用: プロバイダを差し替える
     */
    setProvider(provider: ISecretsProvider): void {
        this.provider = provider
    }

    private async doLoad(): Promise<AppSecrets> {
        const useSecretsManager = process.env.USE_SECRETS_MANAGER === 'true'

        if (useSecretsManager) {
            logger.info('Loading app secrets from AWS Secrets Manager')
            return await this.loadFromSecretsManager()
        }

        logger.info('Loading app secrets from environment variables')
        return this.loadFromEnv()
    }

    private async loadFromSecretsManager(): Promise<AppSecrets> {
        const secretName = process.env.SECRETS_MANAGER_SECRET_NAME ?? SECRET_KEY_APP
        const region = process.env.SECRETS_MANAGER_REGION ?? 'ap-northeast-1'

        const provider = this.provider ?? new AwsSecretsManagerProvider(region)
        const payload = await provider.getSecret<SecretsManagerPayload>(secretName)

        return {
            oauth: {
                google: {
                    clientId: payload.oauth.google.clientId,
                    clientSecret: payload.oauth.google.clientSecret,
                    redirectUri: payload.oauth.google.redirectUri,
                },
                line: {
                    channelId: payload.oauth.line.channelId,
                    channelSecret: payload.oauth.line.channelSecret,
                    redirectUri: payload.oauth.line.redirectUri,
                },
                apple: {
                    clientId: payload.oauth.apple.clientId,
                    teamId: payload.oauth.apple.teamId,
                    keyId: payload.oauth.apple.keyId,
                    privateKey: payload.oauth.apple.privateKey,
                    redirectUri: payload.oauth.apple.redirectUri,
                },
            },
            database: {
                url: payload.database.url,
            },
        }
    }

    private loadFromEnv(): AppSecrets {
        return {
            oauth: {
                google: {
                    clientId: requireEnv('GOOGLE_CLIENT_ID'),
                    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
                    redirectUri: requireEnv('GOOGLE_REDIRECT_URI'),
                },
                line: {
                    channelId: requireEnv('LINE_CHANNEL_ID'),
                    channelSecret: requireEnv('LINE_CHANNEL_SECRET'),
                    redirectUri: requireEnv('LINE_REDIRECT_URI'),
                },
                apple: {
                    clientId: requireEnv('APPLE_CLIENT_ID'),
                    teamId: requireEnv('APPLE_TEAM_ID'),
                    keyId: requireEnv('APPLE_KEY_ID'),
                    privateKey: loadApplePrivateKey(),
                    redirectUri: requireEnv('APPLE_REDIRECT_URI'),
                },
            },
            database: {
                url: requireEnv('DATABASE_URL'),
            },
        }
    }
}

// シングルトンインスタンス
export const AppSecretsLoader = new AppSecretsLoaderImpl()
