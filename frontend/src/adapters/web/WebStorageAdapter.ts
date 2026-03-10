import type { IStoragePort } from '@/core/ports/IStoragePort'

/**
 * Web Browser 用ストレージアダプター — localStorage を使用
 */
export class WebStorageAdapter implements IStoragePort {
    async get(key: string): Promise<string | null> {
        return localStorage.getItem(key)
    }

    async set(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value)
    }

    async remove(key: string): Promise<void> {
        localStorage.removeItem(key)
    }
}
