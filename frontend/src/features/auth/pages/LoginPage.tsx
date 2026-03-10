import { authApi } from '@/features/auth/api/authApi'
import { LoginForm, type LoginFormValues } from '@/features/auth/components/LoginForm'
import { OAuthButtons } from '@/features/auth/components/OAuthButtons'
import { getAuthErrorMessage } from '@/features/auth/types/errorMessages'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { isHttpError } from '@/shared/lib/apiClient'
import { authKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

export function LoginPage() {
    const navigate = useNavigate()
    const qc = useQueryClient()

    const loginMutation = useMutation({
        mutationFn: (data: LoginFormValues) =>
            authApi.loginWithPassword({ email: data.email, password: data.password }),
        onSuccess: async () => {
            // 認証キャッシュを無効化し、/v1/auth/me を再フェッチして完全な AuthUser を取得
            // await で再フェッチ完了を待ってからナビゲーション（0-1 fix）
            await qc.invalidateQueries({ queryKey: authKeys.me() })
            navigate('/', { replace: true })
        },
    })

    const errorMessage = (() => {
        if (!loginMutation.error) return null
        if (isHttpError(loginMutation.error)) {
            return getAuthErrorMessage(loginMutation.error.api.code)
        }
        return 'ログインに失敗しました。しばらく経ってからもう一度お試しください'
    })()

    const handleLogin = (data: LoginFormValues) => {
        loginMutation.mutate(data)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Schedy</CardTitle>
                    <CardDescription>サークルの予定管理アプリにログイン</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* エラー表示 */}
                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* パスワードログインフォーム */}
                    <LoginForm onSubmit={handleLogin} isLoading={loginMutation.isPending} />

                    {/* 区切り線 */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">または</span>
                        </div>
                    </div>

                    {/* OAuthボタン */}
                    <OAuthButtons isLoading={loginMutation.isPending} context="login" />
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        アカウントをお持ちでない方は{' '}
                        <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
                            新規登録
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
