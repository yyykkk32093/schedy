import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'

/**
 * TanStack Query のプロバイダー
 *
 * - QueryClientProvider で children をラップ
 * - 本番環境以外で ReactQueryDevtools を有効化（Query 状態の可視化用）
 */
export function QueryProvider({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {!import.meta.env.PROD && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
}
