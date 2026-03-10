import { WebAuthTokenAdapter, WebStorageAdapter } from '@/adapters/web'
import type { PlatformPorts } from '@/app/providers/PlatformProvider'

/**
 * プラットフォームを検出し、適切なアダプターを選択する
 *
 * - Web Browser: Web用アダプター（httpOnly Cookie, localStorage）
 * - 将来 LIFF: liff.isInClient() で分岐し LIFF 用アダプターに切替（LIFF 案件で対応）
 * - 将来 React Native: RN用アダプター（AsyncStorage, Bearer）
 */
export function createPlatformPorts(): PlatformPorts {
    // 将来: LIFF 環境では liff.isInClient() で分岐し LiffAuthTokenAdapter を使用
    return {
        storage: new WebStorageAdapter(),
        authToken: new WebAuthTokenAdapter(),
    }
}
