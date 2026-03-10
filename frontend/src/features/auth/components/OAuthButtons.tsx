import { redirectToOAuthProvider } from '@/features/auth/types/oauthConfig'
import { Button } from '@/shared/components/ui/button'
import type { OAuthProvider } from '@/shared/types/api'

interface OAuthButtonsProps {
    isLoading: boolean
    context: 'login' | 'signup'
}

/**
 * OAuth プロバイダーのログイン/サインアップボタン群
 *
 * Google / LINE / Apple の3プロバイダーに対応。
 * クリックすると各プロバイダーの認可画面にリダイレクトされる。
 */
export function OAuthButtons({ isLoading, context }: OAuthButtonsProps) {
    const handleOAuth = (provider: OAuthProvider) => {
        if (isLoading) return
        redirectToOAuthProvider(provider)
    }

    const actionText = context === 'login' ? 'ログイン' : '登録'

    return (
        <div className="space-y-3">
            {/* Google */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => handleOAuth('google')}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Googleで{actionText}
            </Button>

            {/* LINE */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => handleOAuth('line')}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#06C755">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738S0 4.935 0 10.304c0 4.814 4.27 8.846 10.035 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.309 14.254 24 12.381 24 10.304zm-16.758 3.14H5.578a.476.476 0 0 1-.476-.476V8.493a.476.476 0 0 1 .952 0v4.001h1.188a.476.476 0 0 1 0 .951zm2.127-.476a.476.476 0 0 1-.952 0V8.493a.476.476 0 0 1 .952 0v4.475zm5.049 0a.476.476 0 0 1-.848.299l-2.444-3.318v3.019a.476.476 0 0 1-.952 0V8.493a.476.476 0 0 1 .848-.299l2.444 3.318V8.493a.476.476 0 0 1 .952 0v4.475zm4.006-3.524a.476.476 0 0 1 0 .951h-1.188v.999h1.188a.476.476 0 0 1 0 .951H16.76a.476.476 0 0 1-.476-.476V8.493a.476.476 0 0 1 .476-.476h1.664a.476.476 0 0 1 0 .951H17.236v1h1.188z" />
                </svg>
                LINEで{actionText}
            </Button>

            {/* Apple */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => handleOAuth('apple')}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Appleで{actionText}
            </Button>
        </div>
    )
}
