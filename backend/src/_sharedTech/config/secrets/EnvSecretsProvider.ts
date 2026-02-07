/**
 * 環境変数からシークレットを取得するプロバイダ
 *
 * local / test 環境で使用する。
 * process.env から読み込んだ値を、期待される JSON 構造に変換して返す。
 */

import { logger } from '@/_sharedTech/logger/logger.js'
import fs from 'fs'
import type { ISecretsProvider } from './ISecretsProvider.js'

/**
 * キーごとに環境変数からどのように値を構築するかを定義
 */
type EnvMappingFn<T> = () => T

export class EnvSecretsProvider implements ISecretsProvider {
    private readonly mappings: Map<string, EnvMappingFn<unknown>> = new Map()

    /**
     * 特定のキーに対して、環境変数からの構築関数を登録する
     */
    registerMapping<T>(key: string, mappingFn: EnvMappingFn<T>): void {
        this.mappings.set(key, mappingFn)
    }

    async getSecret<T>(key: string): Promise<T> {
        const mappingFn = this.mappings.get(key)

        if (!mappingFn) {
            throw new Error(
                `No environment variable mapping registered for key: ${key}. ` +
                `Call registerMapping() first.`
            )
        }

        logger.info({ key }, 'Loading secret from environment variables')

        return mappingFn() as T
    }
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * 必須の環境変数を取得する
 */
export function requireEnv(key: string): string {
    const value = process.env[key]
    if (value === undefined || value === '') {
        throw new Error(`Missing required environment variable: ${key}`)
    }
    return value
}

/**
 * オプションの環境変数を取得する（デフォルト値あり）
 */
export function getEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] ?? defaultValue
}

/**
 * Apple private key をロードする
 * - APPLE_PRIVATE_KEY が設定されていればそれを使用
 * - APPLE_PRIVATE_KEY_PATH が設定されていればファイルから読み込み
 * - どちらもなければ空文字（E2Eテストではmockするので許容）
 */
export function loadApplePrivateKey(): string {
    const privateKey = process.env.APPLE_PRIVATE_KEY
    if (privateKey) {
        // 環境変数では \n がリテラルなので改行に変換
        return privateKey.replace(/\\n/g, '\n')
    }

    const privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH
    if (privateKeyPath) {
        try {
            return fs.readFileSync(privateKeyPath, 'utf-8')
        } catch (err) {
            logger.warn(
                { path: privateKeyPath, error: err },
                'Failed to read Apple private key from file'
            )
        }
    }

    // E2Eテストや開発時はmockするので空でも許容
    logger.warn('Apple private key is not configured (APPLE_PRIVATE_KEY or APPLE_PRIVATE_KEY_PATH)')
    return ''
}
