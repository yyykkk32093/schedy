import { isHttpError } from '@/shared/lib/apiClient'
import { getErrorMessage, isAuthenticationError } from '@/shared/lib/errorMessages'
import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * リトライ対象外の HTTP ステータスコード
 * これらはリトライしても結果が変わらないため即座に失敗させる
 */
const NON_RETRYABLE_STATUSES = new Set([401, 403, 404, 409])

function isNonRetryable(error: unknown): boolean {
    return isHttpError(error) && NON_RETRYABLE_STATUSES.has(error.status)
}

/**
 * Mutation のグローバルエラーハンドラ
 *
 * 全 mutation で onError を個別に書かなくてもトースト通知が出る。
 * - 401: 認証切れ → ログイン画面へリダイレクト
 * - その他: エラーメッセージをトースト表示
 *
 * 個別の mutation で onError を定義している場合もこのハンドラは実行される。
 * `meta.skipGlobalErrorHandler: true` を指定するとグローバルトーストをスキップできる。
 */
const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
        // meta でスキップ指定がある場合はトーストを出さない
        if (mutation.options.meta?.skipGlobalErrorHandler) {
            return
        }

        // 401: 認証エラーはトーストを出さない（AuthProvider 側でリダイレクト処理）
        if (isAuthenticationError(error)) {
            return
        }

        const message = getErrorMessage(error)
        toast.error(message)
    },
})

/**
 * アプリケーション共通の QueryClient
 *
 * - queries: staleTime 60s / gcTime 20min / retry は 2 回まで（non-retryable は即失敗）
 * - mutations: retry なし / グローバル onError でエラートースト表示
 */
export const queryClient = new QueryClient({
    mutationCache,
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
