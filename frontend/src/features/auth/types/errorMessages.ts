/**
 * 認証エラーコードを日本語メッセージに変換
 */
export function getAuthErrorMessage(code: string): string {
    switch (code) {
        case 'USER_NOT_FOUND':
            return 'メールアドレスが見つかりません'
        case 'CREDENTIAL_NOT_FOUND':
            return 'パスワード認証が設定されていません。OAuth（Google/LINE/Apple）でログインしてください'
        case 'INVALID_CREDENTIALS':
            return 'パスワードが正しくありません'
        case 'LOCKED_ACCOUNT':
            return 'アカウントがロックされています。15分後に再度お試しください'
        case 'EMAIL_ALREADY_IN_USE':
            return 'このメールアドレスは既に使用されています'
        case 'ACCOUNT_LINK_REQUIRED':
            return '別の認証方式で登録済みのアカウントがあります。元の方法でログインしてください'
        case 'OAUTH_AUTHENTICATION_FAILED':
            return 'OAuth認証に失敗しました。もう一度お試しください'
        case 'UNSUPPORTED_PROVIDER':
            return 'サポートされていない認証プロバイダーです'
        case 'UNAUTHORIZED':
        case 'INVALID_TOKEN':
            return '認証の有効期限が切れました。再度ログインしてください'
        default:
            return 'エラーが発生しました。しばらく経ってからもう一度お試しください'
    }
}
