
import { EmailAddress } from '@/backend/domains/sharedDomains/model/valueObject/EmailAddress';
import type { IPasswordUserRepository } from '../../../../domains/auth/password/domain/repository/IPasswordUserRepository';
import { PlainPassword } from '../../../../domains/auth/sharedAuth/model/valueObject/PlainPassword';
import type { IPasswordHasher } from '../../../../domains/auth/sharedAuth/service/security/IPasswordHasher';
import type { LoginPasswordUserInput, LoginPasswordUserOutput } from '../dto/LoginPasswordUserDTO';


/**
 * ログインユースケース
 * - メールアドレスでユーザーを検索
 * - パスワードを検証
 * - 認証成功時にトークンなどを返す
 */
export class LoginPasswordUserUseCase {
    constructor(
        private readonly userRepository: IPasswordUserRepository,
        private readonly passwordHasher: IPasswordHasher
    ) { }

    public async execute(input: LoginPasswordUserInput): Promise<LoginPasswordUserOutput> {
        // ① メールアドレスでユーザーを検索
        const email = new EmailAddress(input.email); // ← string → ValueObject 変換
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('ユーザーが存在しません');
        }

        // ② パスワード照合
        const isValid = await user.isPasswordValid(
            new PlainPassword(input.password),
            this.passwordHasher
        );

        if (!isValid) {
            throw new Error('パスワードが一致しません');
        }

        // ③ トークンを生成（仮）
        const token = 'dummy-token'; // TODO: JWT発行に置き換え予定

        // ④ 結果をDTOで返す
        return {
            userId: user.id.getValue(),
            accessToken: token,
        };
    }
}
