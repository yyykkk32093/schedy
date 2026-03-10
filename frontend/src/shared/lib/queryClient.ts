import { isHttpError } from '@/shared/lib/apiClient'
import { QueryClient } from '@tanstack/react-query'

/**
 * リトライ対象外の HTTP ステータスコード
 * これらはリトライしても結果が変わらないため即座に失敗させる
 */
const NON_RETRYABLE_STATUSES = new Set([401, 403, 404, 409])

function isNonRetryable(error: unknown): boolean {
    return isHttpError(error) && NON_RETRYABLE_STATUSES.has(error.status)
}

/**
 * アプリケーション共通の QueryClient
 *
 * - queries: staleTime 60s / gcTime 20min / retry は 2 回まで（non-retryable は即失敗）
 * - mutations: retry なし
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            gcTime: 20 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
                failureCount < 2 && !isNonRetryable(error),
        },
        mutations: {
            retry: 0,
        },
    },
})
