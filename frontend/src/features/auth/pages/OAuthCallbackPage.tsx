import { authApi } from '@/features/auth/api/authApi'
import { getAuthErrorMessage } from '@/features/auth/types/errorMessages'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { isHttpError } from '@/shared/lib/apiClient'
import { authKeys } from '@/shared/lib/queryKeys'
import type { OAuthProvider } from '@/shared/types/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * OAuthコールバックページ
 *
 * /auth/callback/:provider でプロバイダーの認可画面から戻ってきた時に表示。
 * URLのクエリパラメータから code を取得し、バックエンドに送信して認証を完了する。
 */
export function OAuthCallbackPage() {
    const { provider } = useParams<{ provider: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const calledRef = useRef(false)

    const oauthMutation = useMutation({
        mutationFn: ({ oauthProvider, code }: { oauthProvider: OAuthProvider; code: string }) => {
            const redirectUri = `${window.location.origin}/auth/callback/${oauthProvider}`
            return authApi.loginWithOAuth(oauthProvider, { code, redirectUri })
        },
        onSuccess: async () => {
            // 認証キャッシュを無効化し、/v1/auth/me を再フェッチして完全な AuthUser を取得
            // await で再フェッチ完了を待ってからナビゲーション（0-1 fix）
            await qc.invalidateQueries({ queryKey: authKeys.me() })
            navigate('/', { replace: true })
        },
    })

    useEffect(() => {
        // StrictMode の二重実行を防止
        if (calledRef.current) return
        calledRef.current = true

        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')

        // プロバイダーが不正な場合
        if (provider !== 'google' && provider !== 'line' && provider !== 'apple') {
            return
        }

        // ユーザーが認可を拒否した場合
        if (errorParam) {
            return
        }

        // codeがない場合
        if (!code) {
            return
        }

        // CSRF対策: stateの検証
        const savedState = sessionStorage.getItem('oauth_state')
        if (savedState && state !== savedState) {
            return
        }
        sessionStorage.removeItem('oauth_state')

        oauthMutation.mutate({ oauthProvider: provider as OAuthProvider, code })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── バリデーションエラー（mutation 前に検出） ──
    const validationError = (() => {
        if (provider !== 'google' && provider !== 'line' && provider !== 'apple') {
            return '不正な認証プロバイダーです'
        }
        if (searchParams.get('error')) {
            return '認証がキャンセルされました'
        }
        if (!searchParams.get('code')) {
            return '認証コードが見つかりません'
        }
        const savedState = sessionStorage.getItem('oauth_state')
        if (savedState && searchParams.get('state') !== savedState) {
            return 'セキュリティ検証に失敗しました。再度ログインしてください'
        }
        return null
    })()

    // ── mutation エラー ──
    const mutationError = (() => {
        if (!oauthMutation.error) return null
        if (isHttpError(oauthMutation.error)) {
            return getAuthErrorMessage(oauthMutation.error.api.code)
        }
        return '認証に失敗しました。もう一度お試しください'
    })()

    const displayError = validationError ?? mutationError

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>認証処理中</CardTitle>
                    <CardDescription>
                        {displayError ? '認証に問題が発生しました' : '認証を処理しています...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {displayError ? (
                        <div className="space-y-4">
                            <Alert variant="destructive">
                                <AlertDescription>{displayError}</AlertDescription>
                            </Alert>
                            <div className="text-center">
                                <button
                                    onClick={() => navigate('/login', { replace: true })}
                                    className="text-sm text-primary underline-offset-4 hover:underline"
                                >
                                    ログイン画面に戻る
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
