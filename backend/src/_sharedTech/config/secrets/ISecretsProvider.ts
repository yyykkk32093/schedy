/**
 * シークレット取得のインターフェイス
 *
 * AWS Secrets Manager や環境変数など、シークレット取得元を抽象化する。
 * これにより、本番環境と開発環境で異なる実装を差し替え可能にする。
 */
export interface ISecretsProvider {
    /**
     * シークレットを取得する
     * @param key シークレットのキー（Secrets Manager の Secret Name など）
     * @returns JSON パースされたシークレット
     */
    getSecret<T>(key: string): Promise<T>
}
