// src/domains/auth/authShared/infrastructure/security/BcryptPasswordHasher.ts
import bcrypt from 'bcrypt';
import { HashedPassword } from '../../model/valueObject/HashedPassword';
import { PlainPassword } from '../../model/valueObject/PlainPassword';
import type { IPasswordHasher } from '../../service/security/IPasswordHasher';

/**
 * bcryptによるパスワードハッシュ化サービス。
 * IPasswordHasherの具象実装として機能する。
 */
export class BcryptPasswordHasher implements IPasswordHasher {
    private static readonly SALT_ROUNDS = 10;

    /**
     * 平文パスワードをハッシュ化
     */
    async hash(plainPassword: PlainPassword): Promise<HashedPassword> {
        const hashed = await bcrypt.hash(plainPassword.value, BcryptPasswordHasher.SALT_ROUNDS);
        return new HashedPassword(hashed);
    }

    /**
     * 平文とハッシュの一致判定
     */
    async compare(plainPassword: PlainPassword, hashedPassword: HashedPassword): Promise<boolean> {
        return await bcrypt.compare(plainPassword.value, hashedPassword.value);
    }
}
