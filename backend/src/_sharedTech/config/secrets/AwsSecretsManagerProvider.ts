/**
 * AWS Secrets Manager からシークレットを取得するプロバイダ
 *
 * production 環境で使用する。
 */

import { logger } from '@/_sharedTech/logger/logger.js'
import type { ISecretsProvider } from './ISecretsProvider.js'

export class AwsSecretsManagerProvider implements ISecretsProvider {
    private readonly region: string

    constructor(region: string = 'ap-northeast-1') {
        this.region = region
    }

    async getSecret<T>(secretName: string): Promise<T> {
        // 動的インポート（ローカル環境では aws-sdk がなくてもエラーにならない）
        const { SecretsManagerClient, GetSecretValueCommand } = await import(
            '@aws-sdk/client-secrets-manager'
        )

        const client = new SecretsManagerClient({ region: this.region })
        const command = new GetSecretValueCommand({ SecretId: secretName })

        const response = await client.send(command)

        if (!response.SecretString) {
            throw new Error(`Secret ${secretName} has no SecretString`)
        }

        logger.info(
            { secretName, region: this.region },
            'Successfully loaded secret from AWS Secrets Manager'
        )

        return JSON.parse(response.SecretString) as T
    }
}
