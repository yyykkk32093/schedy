import { LoginPasswordUserUseCase } from '@/backend/application/auth/password/usecase/LoginPasswordUserUseCase';
import { PasswordUserRepositoryImpl } from '@/backend/domains/auth/password/infrastructure/repository/PasswordUserRepositoryImpl';
import { BcryptPasswordHasher } from '@/backend/domains/auth/sharedAuth/infrastructure/security/BcryptPasswordHasher';

import { describe, expect, it } from 'vitest';

describe('LoginPasswordUserUseCase', () => {
    const useCase = new LoginPasswordUserUseCase(
        new PasswordUserRepositoryImpl(),
        new BcryptPasswordHasher()
    );

    it('ログイン成功', async () => {
        const result = await useCase.execute({
            email: 'test@example.com',
            password: 'password123',
        });

        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('accessToken');
    });

    it('存在しないユーザー', async () => {
        await expect(
            useCase.execute({
                email: 'notfound@example.com',
                password: 'password123',
            })
        ).rejects.toThrow('ユーザーが存在しません');
    });

    it('パスワード不一致', async () => {
        await expect(
            useCase.execute({
                email: 'test@example.com',
                password: 'password1234',
            })
        ).rejects.toThrow('パスワードが一致しません');
    });
});
