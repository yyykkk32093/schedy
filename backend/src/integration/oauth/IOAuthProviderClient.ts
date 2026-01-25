export type OAuthProvider = 'google' | 'line' | 'apple'

export type OAuthProfile = {
    provider: OAuthProvider
    providerUserId: string
    email?: string | null
    displayName?: string | null
}

export interface IOAuthProviderClient {
    readonly provider: OAuthProvider

    /**
     * Authorization Code を IdP に渡し、アプリで使うプロフィール（主にsub/email）を得る。
     *
     * - 外部呼び出しのため、ここではthrowして良い（UseCase側で失敗イベントを確定させる）
     */
    fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile>
}
