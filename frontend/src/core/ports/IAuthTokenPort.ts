/**
 * 認証トークンポート — トークン管理の抽象化
 *
 * Web: httpOnly Cookie（サーバー管理、フロント側はほぼ透過的）
 * LIFF: Bearer ヘッダー（liff.getAccessToken() 経由）
 * ネイティブアプリ: SecureStore + Authorization Bearer ヘッダー
 *
 * ⚠ core/ ディレクトリ内のためDOM API・外部ライブラリへの直接依存禁止
 */
export interface IAuthTokenPort {
    /**
     * トークンを取得する
     * Web: null を返す（Cookie はブラウザが自動送信するため不要）
     * LIFF/ネイティブアプリ: Secure Storageからトークンを読み出す
     */
    getAccessToken(): Promise<string | null>

    /**
     * トークンを保存する
     * Web: 何もしない（httpOnly Cookieはサーバーが設定する）
     * LIFF/ネイティブアプリ: Secure Storageにトークンを保存する
     */
    setAccessToken(token: string): Promise<void>

    /**
     * トークンを削除する
     * Web: 何もしない（ログアウトAPIでサーバー側がCookieをクリアする）
     * LIFF/ネイティブアプリ: Secure Storageからトークンを削除する
     */
    clearToken(): Promise<void>

    /**
     * トークンが存在するかどうか
     * Web: Cookie の有無はJSから確認できないため、別途APIで確認する想定
     * LIFF/ネイティブアプリ: Secure Storageの値の有無で判定
     */
    hasToken(): Promise<boolean>
}
