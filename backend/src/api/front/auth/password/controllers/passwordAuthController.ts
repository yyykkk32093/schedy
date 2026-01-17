import { logger } from '@/_sharedTech/logger/logger.js';
import { usecaseFactory } from '@/api/_usecaseFactory.js';
import { AuthenticationFailedError } from '@/application/auth/error/AuthenticationFailedError.js';
import type { Request, Response } from 'express';

export const passwordAuthController = {
    /**
     * パスワードログイン
     * POST /v1/auth/password
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const useCase = usecaseFactory.createSignInPasswordUserUseCase()
            const result = await useCase.execute({ email, password });

            res.status(200).json({
                userId: result.userId,
                accessToken: result.accessToken,
            });
        } catch (error) {
            if (error instanceof AuthenticationFailedError) {
                res.status(error.statusCode).json({
                    code: error.reason,
                    message: error.message,
                })
                return
            }

            logger.error({ error: error }, "[PasswordAuth Error]")
            res.status(401).json({ message: (error as Error).message });
        }
    },
};
