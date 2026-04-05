import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import type { NextFunction, Request, Response } from 'express'
import { isUserBlacklisted } from './userBlacklist.js'

/**
 * 認証ミドルウェア（ハイブリッド方式）
 *
 * 以下の順序でJWTトークンを探す:
 * 1. httpOnly Cookie（Web Browser 向け）
 * 2. Authorization: Bearer ヘッダー（LIFF / ネイティブアプリ向け）
 *
 * トークンが見つかったら JWT を検証し、req.user にペイロードを設定する。
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
    const jwtService = new JwtTokenService(jwtSecret)

    // 1. Cookie からトークンを取得
    let token: string | undefined = (req as any).cookies?.token

    // 2. Cookie になければ Authorization ヘッダーから取得
    if (!token) {
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7)
        }
    }

    // トークンが見つからない場合
    if (!token) {
        res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
        })
        return
    }

    try {
        const payload = jwtService.verify(token)

        // D-P2-10: 退会済みユーザーのJWT無効化
        if (isUserBlacklisted(payload.sub)) {
            res.status(401).json({
                code: 'USER_DELETED',
                message: 'このアカウントは退会済みです',
            })
            return
        }

        // req.user にペイロードを設定
        req.user = {
            userId: payload.sub,
            email: payload.email,
        }
        next()
    } catch {
        res.status(401).json({
            code: 'INVALID_TOKEN',
            message: 'トークンが無効または期限切れです',
        })
    }
}
