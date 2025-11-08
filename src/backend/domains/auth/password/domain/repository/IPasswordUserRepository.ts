
import type { EmailAddress } from '@/backend/domains/sharedDomains/model/valueObject/EmailAddress';
import type { PasswordUser } from '../model/entity/PasswordUser';

/**
 * パスワード認証ユーザーの永続化を扱うリポジトリの抽象インターフェース。
 * 
 * - UseCase層はこの契約を通してドメインモデルを取得・保存する。
 * - 実際の実装は Infrastructure 層に配置（DB, API など）。
 */
export interface IPasswordUserRepository {
    /**
     * メールアドレスでユーザーを検索。
     * @param email 検索対象のメールアドレス
     * @returns ユーザーが存在すれば PasswordUser、なければ null
     */
    findByEmail(email: EmailAddress): Promise<PasswordUser | null>;

    /**
     * ユーザーを保存。
     * 新規作成または更新を兼ねる。
     */
    save(user: PasswordUser): Promise<void>;
}
