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
     * POST /v1/auth/sessions { method: "password", ... }
     *
     * Phase 3 (REST 再設計): 旧 `POST /v1/auth/password` を統合エンドポイントに変更。
     */
    loginWithPassword: (data: PasswordLoginRequest) =>
        http<PasswordLoginResponse>('/v1/auth/sessions', {
            method: 'POST',
            json: { method: 'password', ...data },
        }),

    /**
     * OAuthログイン（初回は自動サインアップ）
     * POST /v1/auth/sessions { method: "oauth", provider, ... }
     *
     * Phase 3 (REST 再設計): 旧 `POST /v1/auth/oauth/:provider` を統合エンドポイントに変更。
     */
    loginWithOAuth: (provider: OAuthProvider, data: OAuthLoginRequest) =>
        http<OAuthLoginResponse>('/v1/auth/sessions', {
            method: 'POST',
            json: { method: 'oauth', provider, ...data },
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
