// src/domains/auth/authShared/service/security/IPasswordHasher.ts
import { HashedPassword } from '../../model/valueObject/HashedPassword';
import { PlainPassword } from '../../model/valueObject/PlainPassword';

/**
 * パスワードハッシュ化処理の抽象インターフェース。
 * ドメイン層はこの契約にのみ依存し、具体的なアルゴリズムには依存しない。
 */
export interface IPasswordHasher {
    /**
     * 平文パスワードをハッシュ化する
     */
    hash(plainPassword: PlainPassword): Promise<HashedPassword>;

    /**
     * 平文パスワードとハッシュ済みパスワードが一致するか検証する
     */
    compare(plainPassword: PlainPassword, hashedPassword: HashedPassword): Promise<boolean>;
}
