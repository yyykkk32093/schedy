import type { Response } from 'express'

/**
 * httpOnly Cookie でアクセストークンを設定するユーティリティ
 *
 * - HttpOnly: JavaScript からアクセス不可（XSS 対策）
 * - Secure: HTTPS 通信時のみ送信（localhost では HTTP でも送信可）
 * - SameSite=Lax: クロスサイトリクエスト制限（CSRF 対策）
 * - maxAge: 7日（JWT の有効期限と合わせる）
 */
export function setAuthCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,  // 本番は HTTPS 必須、ローカルは HTTP でも OK
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7日 (ミリ秒)
    })
}

/**
 * httpOnly Cookie をクリアする
 */
export function clearAuthCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production'

    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
    })
}
