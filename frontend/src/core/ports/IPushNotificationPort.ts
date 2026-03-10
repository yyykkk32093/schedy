/**
 * プッシュ通知ポート — 将来対応用の抽象化
 *
 * ⚠ core/ ディレクトリ内のためDOM API・外部ライブラリへの直接依存禁止
 */
export interface IPushNotificationPort {
    requestPermission(): Promise<boolean>
    getToken(): Promise<string | null>
    onMessage(callback: (payload: unknown) => void): () => void
}
