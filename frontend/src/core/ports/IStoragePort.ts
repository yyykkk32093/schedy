/**
 * ストレージポート — KV保存の抽象化
 *
 * Web: localStorage
 * LIFF: localStorage（Web と同じ）
 * ネイティブアプリ: AsyncStorage / SecureStore
 *
 * ⚠ core/ ディレクトリ内のためDOM API・外部ライブラリへの直接依存禁止
 */
export interface IStoragePort {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    remove(key: string): Promise<void>
}
