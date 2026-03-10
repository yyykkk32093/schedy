import type { NextFunction, Request, Response } from 'express'

import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { setAuthCookie } from '@/api/middleware/cookieUtils.js'

export const oauthAuthController = {
    /**
     * OAuthログイン（初回は自動signup）
     * POST /v1/auth/oauth/:provider
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const provider = String(req.params.provider ?? '')
            const { code, redirectUri } = (req.body ?? {}) as {
                code?: unknown
                redirectUri?: unknown
            }

            if (
                provider !== 'google' &&
                provider !== 'line' &&
                provider !== 'apple'
            ) {
                return res.status(400).json({ message: 'unsupported provider' })
            }

            if (typeof code !== 'string') {
                return res.status(400).json({ message: 'code is required' })
            }

            const result = await usecaseFactory
                .createSignInOAuthUserUseCase()
                .execute({
                    provider,
                    code,
                    redirectUri:
                        typeof redirectUri === 'string' ? redirectUri : undefined,
                    ipAddress: req.ip,
                })

            // httpOnly Cookie を設定（Web Browser 向け）
            setAuthCookie(res, result.accessToken)

            // レスポンスボディにも返す（LIFF / ネイティブアプリ向け）
            return res.status(200).json({
                userId: result.userId,
                accessToken: result.accessToken,
            })
        } catch (err) {
            next(err)
        }
    },
}
