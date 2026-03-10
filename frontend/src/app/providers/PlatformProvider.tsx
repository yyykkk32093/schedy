import type { IAuthTokenPort } from '@/core/ports/IAuthTokenPort'
import type { IStoragePort } from '@/core/ports/IStoragePort'
import { createContext, useContext, type ReactNode } from 'react'

/**
 * プラットフォーム依存のポート群
 */
export interface PlatformPorts {
    storage: IStoragePort
    authToken: IAuthTokenPort
}

const PlatformContext = createContext<PlatformPorts | null>(null)

/**
 * プラットフォームポートを取得するフック
 */
export function usePlatform(): PlatformPorts {
    const ctx = useContext(PlatformContext)
    if (!ctx) {
        throw new Error('usePlatform must be used within PlatformProvider')
    }
    return ctx
}

interface PlatformProviderProps {
    ports: PlatformPorts
    children: ReactNode
}

/**
 * プラットフォーム依存のポート実装を注入する Provider
 *
 * main.tsx でプラットフォームを検出し、対応するアダプターを渡す。
 */
export function PlatformProvider({ ports, children }: PlatformProviderProps) {
    return (
        <PlatformContext.Provider value={ports}>
            {children}
        </PlatformContext.Provider>
    )
}
