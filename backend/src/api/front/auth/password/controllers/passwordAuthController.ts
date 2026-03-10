import { usecaseFactory } from '@/api/_usecaseFactory.js';
import { setAuthCookie } from '@/api/middleware/cookieUtils.js';
import type { NextFunction, Request, Response } from 'express';

export const passwordAuthController = {
    /**
     * パスワードログイン
     * POST /v1/auth/password
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const useCase = usecaseFactory.createSignInPasswordUserUseCase()
            const result = await useCase.execute({ email, password });

            // httpOnly Cookie を設定（Web Browser 向け）
            setAuthCookie(res, result.accessToken);

            // レスポンスボディにも返す（LIFF / ネイティブアプリ向け）
            res.status(200).json({
                userId: result.userId,
                accessToken: result.accessToken,
            });
        } catch (err) {
            next(err)
        }
    },
};
