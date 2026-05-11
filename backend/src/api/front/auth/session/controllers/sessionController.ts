import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { setAuthCookie } from '@/api/middleware/cookieUtils.js'
import type { CreateSessionInput } from '@/api/schemas/index.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * セッション作成 (= ログイン) コントローラ
 *
 * Phase 3 (REST 再設計): 旧 `POST /v1/auth/password` / `POST /v1/auth/oauth/:provider`
 * を `POST /v1/auth/sessions` に統合。body の `method` で認証方式を判別。
 */
export const sessionController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateSessionInput

            const result =
                body.method === 'password'
                    ? await usecaseFactory.createSignInPasswordUserUseCase().execute({
                        email: body.email,
                        password: body.password,
                    })
                    : await usecaseFactory.createSignInOAuthUserUseCase().execute({
                        provider: body.provider,
                        code: body.code,
                        redirectUri: body.redirectUri,
                        ipAddress: req.ip,
                    })

            // httpOnly Cookie を設定（Web Browser 向け）
            setAuthCookie(res, result.accessToken)

            // レスポンスボディにも返す（LIFF / ネイティブアプリ向け）
            res.status(201).json({
                userId: result.userId,
                accessToken: result.accessToken,
            })
        } catch (err) {
            next(err)
        }
    },
}
