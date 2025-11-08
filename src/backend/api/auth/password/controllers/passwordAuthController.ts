import type { Request, Response } from 'express';
import { LoginPasswordUserUseCase } from '../../../../application/auth/password/usecase/LoginPasswordUserUseCase';
import { PasswordUserRepositoryImpl } from '../../../../domains/auth/password/infrastructure/repository/PasswordUserRepositoryImpl';
import { BcryptPasswordHasher } from '../../../../domains/auth/sharedAuth/infrastructure/security/BcryptPasswordHasher';

// UseCaseインスタンスを初期化
const useCase = new LoginPasswordUserUseCase(
    new PasswordUserRepositoryImpl(),
    new BcryptPasswordHasher()
);

export const passwordAuthController = {
    /**
     * パスワードログイン
     * POST /v1/auth/password
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

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
