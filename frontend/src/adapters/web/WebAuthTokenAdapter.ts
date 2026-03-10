import type { IAuthTokenPort } from '@/core/ports/IAuthTokenPort'

/**
 * Web Browser 用認証トークンアダプター
 *
 * httpOnly Cookie 方式:
 * - サーバーが Set-Cookie でトークンを設定
 * - ブラウザが以降のリクエストで自動的にCookieを送信
 * - JavaScript からは Cookie にアクセスできない（HttpOnly）
 * - フロント側はほぼ透過的（何もしなくてOK）
 *
 * ただし、サーバーからレスポンスボディで返される accessToken を
 * 将来のLIFF/ネイティブアプリ対応時にも使えるように保持する仕組みを残す。
 */
export class WebAuthTokenAdapter implements IAuthTokenPort {
    /**
     * Web では httpOnly Cookie を使うため、フロントからトークンを取得する必要はない。
     * axios の withCredentials: true でブラウザが自動的に Cookie を送信する。
     */
    async getAccessToken(): Promise<string | null> {
        return null
    }

    /**
     * Web では httpOnly Cookie をサーバーが設定するため、フロントでは何もしない。
     */
    async setAccessToken(_token: string): Promise<void> {
        // httpOnly Cookie はサーバー側で設定されるため、フロント側では何もしない
    }

    /**
     * Web では Cookie のクリアはサーバーの logout API が行う。
     */
    async clearToken(): Promise<void> {
        // ログアウト API (POST /v1/auth/logout) でサーバーが Cookie をクリアする
    }

    /**
     * Web では httpOnly Cookie の有無を JS から確認できないため、常に true を返す。
     * 実際の認証状態はサーバーへの API 呼び出し結果で判定する。
     */
    async hasToken(): Promise<boolean> {
        // httpOnly Cookie の有無は JS から確認不可。
        // 認証状態は API 呼び出し（GET /v1/auth/me 等）で確認する。
        return true
    }
}
