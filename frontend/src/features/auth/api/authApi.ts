import { http } from '@/shared/lib/apiClient'
import type {
    OAuthLoginRequest,
    OAuthLoginResponse,
    OAuthProvider,
    PasswordLoginRequest,
    PasswordLoginResponse,
    SignUpRequest,
    SignUpResponse,
} from '@/shared/types/api'

/**
 * 認証関連の API クライアント
 *
 * TanStack Query の queryFn / mutationFn から呼び出す。
 * logout / me は AuthProvider が直接 http() を呼ぶため、ここには含めない。
 */
export const authApi = {
    /**
     * パスワードログイン
     * POST /v1/auth/password
     */
    loginWithPassword: (data: PasswordLoginRequest) =>
        http<PasswordLoginResponse>('/v1/auth/password', {
            method: 'POST',
            json: data,
        }),

    /**
     * OAuthログイン（初回は自動サインアップ）
     * POST /v1/auth/oauth/:provider
     */
    loginWithOAuth: (provider: OAuthProvider, data: OAuthLoginRequest) =>
        http<OAuthLoginResponse>(`/v1/auth/oauth/${provider}`, {
            method: 'POST',
            json: data,
        }),

    /**
     * サインアップ（ユーザー登録）
     * POST /v1/users
     */
    signUp: (data: SignUpRequest) =>
        http<SignUpResponse>('/v1/users', {
            method: 'POST',
            json: data,
        }),
}
