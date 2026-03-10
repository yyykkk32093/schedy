import { authApi } from '@/features/auth/api/authApi'
import { OAuthButtons } from '@/features/auth/components/OAuthButtons'
import { SignupForm, type SignupFormValues } from '@/features/auth/components/SignupForm'
import { getAuthErrorMessage } from '@/features/auth/types/errorMessages'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { isHttpError } from '@/shared/lib/apiClient'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

export function SignupPage() {
    const navigate = useNavigate()

    const signupMutation = useMutation({
        mutationFn: (data: SignupFormValues) =>
            authApi.signUp({
                email: data.email,
                password: data.password,
                displayName: data.displayName || undefined,
            }),
        onSuccess: () => {
            // 2秒後にログイン画面へ遷移
            setTimeout(() => {
                navigate('/login', { replace: true })
            }, 2000)
        },
    })

    const errorMessage = (() => {
        if (!signupMutation.error) return null
        if (isHttpError(signupMutation.error)) {
            return getAuthErrorMessage(signupMutation.error.api.code)
        }
        return '登録に失敗しました。しばらく経ってからもう一度お試しください'
    })()

    const handleSignup = (data: SignupFormValues) => {
        signupMutation.mutate(data)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">アカウント作成</CardTitle>
                    <CardDescription>Schedyに新規登録してサークルの予定を管理しよう</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* 成功メッセージ */}
                    {signupMutation.isSuccess && (
                        <Alert>
                            <AlertDescription>
                                登録が完了しました！ログイン画面に移動します...
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* エラー表示 */}
                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* サインアップフォーム */}
                    {!signupMutation.isSuccess && (
                        <>
                            <SignupForm onSubmit={handleSignup} isLoading={signupMutation.isPending} />

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
                            <OAuthButtons isLoading={signupMutation.isPending} context="signup" />
                        </>
                    )}
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        既にアカウントをお持ちの方は{' '}
                        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                            ログイン
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
