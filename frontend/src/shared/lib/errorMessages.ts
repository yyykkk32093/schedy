import { isHttpError } from '@/shared/lib/apiClient'

/**
 * BE エラーコード → ユーザー向け日本語メッセージのマッピング
 *
 * BE の HttpError.code に対応する表示テキストを定義。
 * ここに登録されていないコードは apiError.message をフォールバック表示する。
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
    // ── 認証系 ──
    INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
    SESSION_EXPIRED: 'セッションが切れました。再度ログインしてください',
    OAUTH_AUTHENTICATION_FAILED: 'ソーシャルログインに失敗しました',
    ACCOUNT_LINK_REQUIRED: 'このメールアドレスは既に別の方法で登録されています',

    // ── コミュニティ ──
    COMMUNITY_NOT_FOUND: 'コミュニティが見つかりません',
    COMMUNITY_PERMISSION_DENIED: 'この操作を行う権限がありません',
    MEMBERSHIP_NOT_FOUND: 'コミュニティに参加していません',
    MEMBERSHIP_ALREADY_EXISTS: '既にこのコミュニティに参加しています',

    // ── アクティビティ / スケジュール ──
    ACTIVITY_NOT_FOUND: 'アクティビティが見つかりません',
    ACTIVITY_PERMISSION_DENIED: 'この操作を行う権限がありません',
    SCHEDULE_NOT_FOUND: 'スケジュールが見つかりません',
    SCHEDULE_PERMISSION_DENIED: 'この操作を行う権限がありません',

    // ── 参加 ──
    PARTICIPATION_ERROR: '参加処理でエラーが発生しました',
    WAITLIST_ERROR: 'キャンセル待ち処理でエラーが発生しました',

    // ── お知らせ ──
    ANNOUNCEMENT_NOT_FOUND: 'お知らせが見つかりません',
    ANNOUNCEMENT_PERMISSION_DENIED: 'この操作を行う権限がありません',

    // ── ユーザー ──
    EMAIL_ALREADY_IN_USE: 'このメールアドレスは既に使用されています',

    // ── バリデーション ──
    DOMAIN_VALIDATION_ERROR: '入力内容に誤りがあります',

    // ── サーバーエラー ──
    INTERNAL_SERVER_ERROR: 'サーバーでエラーが発生しました。しばらく経ってからお試しください',
}

/**
 * HTTP ステータスコードごとのフォールバックメッセージ
 */
const STATUS_FALLBACK_MAP: Record<number, string> = {
    400: '入力内容に誤りがあります',
    401: 'ログインが必要です',
    403: 'この操作を行う権限がありません',
    404: 'お探しのデータが見つかりません',
    409: '競合が発生しました。画面を更新してください',
    500: 'サーバーでエラーが発生しました。しばらく経ってからお試しください',
}

const DEFAULT_ERROR_MESSAGE = 'エラーが発生しました。しばらく経ってからお試しください'

/**
 * unknown なエラーからユーザー向けメッセージを取得する
 *
 * 優先順位:
 * 1. ERROR_MESSAGE_MAP[error.api.code]
 * 2. error.api.message（BE が返した文言をそのまま表示）
 * 3. STATUS_FALLBACK_MAP[error.status]
 * 4. DEFAULT_ERROR_MESSAGE
 */
export function getErrorMessage(error: unknown): string {
    if (isHttpError(error)) {
        const { code, message } = error.api
        return ERROR_MESSAGE_MAP[code] ?? message ?? STATUS_FALLBACK_MAP[error.status] ?? DEFAULT_ERROR_MESSAGE
    }

    if (error instanceof Error) {
        // ネットワークエラー（fetch が throw するケース）
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            return 'ネットワーク接続を確認してください'
        }
        if (error.name === 'AbortError') {
            return 'リクエストがタイムアウトしました'
        }
    }

    return DEFAULT_ERROR_MESSAGE
}

/**
 * 401 エラーかどうかを判定する
 * QueryClient のグローバルハンドラで認証エラーの特別処理に使用
 */
export function isAuthenticationError(error: unknown): boolean {
    return isHttpError(error) && error.status === 401
}
