
import { EmailAddress } from '@/backend/domains/sharedDomains/model/valueObject/EmailAddress';
import { UserId } from '@/backend/domains/sharedDomains/model/valueObject/UserId';
import { HashedPassword } from '../../../sharedAuth/model/valueObject/HashedPassword';
import { PasswordUser } from '../../domain/model/entity/PasswordUser';
import type { IPasswordUserRepository } from '../../domain/repository/IPasswordUserRepository';

/**
 * パスワード認証ユーザーのインメモリ実装。
 * 開発初期・テスト用に利用。永続化は行わない。
 */
export class PasswordUserRepositoryImpl implements IPasswordUserRepository {
    private users: PasswordUser[] = [];

    constructor() {
        // ダミーデータを1件登録
        const dummyUser = new PasswordUser(
            new UserId('u001'),
            new EmailAddress('test@example.com'),
            new HashedPassword('$2b$10$ahr/xBSd9sAnw4H3GgrO8eSeP1E7R3mj285DkzFcORqMK1JKxOgay'), // bcrypt想定
            new Date(),
            new Date()
        );
        this.users.push(dummyUser);
    }

    public async findByEmail(email: EmailAddress): Promise<PasswordUser | null> {
        const user = this.users.find(u => u.emailAddress.equals(email));
        return user ?? null;
    }

    public async save(user: PasswordUser): Promise<void> {
        const idx = this.users.findIndex(u => u.id.equals(user.id));
        if (idx >= 0) {
            this.users[idx] = user; // 更新
        } else {
            this.users.push(user); // 新規登録
        }
    }
}
