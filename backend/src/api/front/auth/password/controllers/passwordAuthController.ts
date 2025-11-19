import { usecaseFactory } from '@/api/_usecaseFactory.js';
import type { Request, Response } from 'express';

export const passwordAuthController = {
    /**
     * パスワードログイン
     * POST /v1/auth/password
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const useCase = usecaseFactory.createLoginPasswordUserUseCase()
            const result = await useCase.execute({ email, password });

            res.status(200).json({
                userId: result.userId,
                accessToken: result.accessToken,
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(401).json({ message: (error as Error).message });
        }
    },
};
