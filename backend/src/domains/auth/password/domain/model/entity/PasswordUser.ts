// src/domains/auth/password/domain/model/entity/PasswordUser.ts
import { HashedPassword } from '@/domains/auth/sharedAuth/model/valueObject/HashedPassword.js'
import { PlainPassword } from '@/domains/auth/sharedAuth/model/valueObject/PlainPassword.js'
import { IPasswordHasher } from '@/domains/auth/sharedAuth/service/security/IPasswordHasher.js'
import { AggregateRoot } from '@/domains/sharedDomains/model/entity/AggregateRoot.js'
import { EmailAddress } from '@/domains/sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/sharedDomains/model/valueObject/UserId.js'
import { PasswordUserLoggedInEvent } from '../../event/PasswordUserLoggedInEvent.js'
import { PasswordUserLoginFailedEvent } from '../../event/PasswordUserLoginFailedEvent.js'

/**
 * パスワード認証ユーザー（集約ルート）。
 * - ログイン成功／失敗をドメインイベントとして蓄積する。
 */
export class PasswordUser extends AggregateRoot {
  constructor(
    public readonly id: UserId,
    public readonly emailAddress: EmailAddress,
    public readonly hashedPassword: HashedPassword,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super()
  }

  /**
   * 入力された平文パスワードがユーザーのハッシュと一致するか検証し、
   * 結果に応じてドメインイベントを追加する。
   */
  public async tryLogin(
    input: PlainPassword,
    hasher: IPasswordHasher
  ): Promise<boolean> {
    const isValid = await hasher.compare(input, this.hashedPassword)

    if (!isValid) {
      this.addDomainEvent(
        new PasswordUserLoginFailedEvent({
          userId: this.id.getValue(),
          email: this.emailAddress.getValue(),
          reason: 'INVALID_CREDENTIALS',
        })
      )
      return false
    }

    this.addDomainEvent(
      new PasswordUserLoggedInEvent({
        userId: this.id.getValue(),
        email: this.emailAddress.getValue(),
      })
    )

    return true
  }

  /**
   * パスワード再設定（ハッシュ更新）
   */
  public changePassword(newHashedPassword: HashedPassword): PasswordUser {
    return new PasswordUser(
      this.id,
      this.emailAddress,
      newHashedPassword,
      this.createdAt,
      new Date() // updatedAt更新
    )
  }
}



// import { HashedPassword } from "@/domains/auth/sharedAuth/model/valueObject/HashedPassword.js";
// import { PlainPassword } from "@/domains/auth/sharedAuth/model/valueObject/PlainPassword.js";
// import { IPasswordHasher } from "@/domains/auth/sharedAuth/service/security/IPasswordHasher.js";
// import { EmailAddress } from "@/domains/sharedDomains/model/valueObject/EmailAddress.js";
// import { UserId } from "@/domains/sharedDomains/model/valueObject/UserId.js";


// /**
//  * パスワード認証ユーザーを表すエンティティ。
//  * - ユーザーID、メールアドレス、ハッシュ済みパスワードを保持。
//  * - 認証チェック（isPasswordValid）を提供。
//  */
// export class PasswordUser {
//   constructor(
//     public readonly id: UserId,
//     public readonly emailAddress: EmailAddress,
//     public readonly hashedPassword: HashedPassword,
//     public readonly createdAt: Date,
//     public readonly updatedAt: Date
//   ) { }

//   /**
//    * 入力された平文パスワードがユーザーのハッシュと一致するか検証する。
//    * 技術的なハッシュ処理は外部（IPasswordHasher）に委譲する。
//    */
//   public async isPasswordValid(
//     input: PlainPassword,
//     hasher: IPasswordHasher
//   ): Promise<boolean> {
//     return await hasher.compare(input, this.hashedPassword);
//   }

//   /**
//    * パスワードの再設定などでハッシュを更新する場合。
//    */
//   public changePassword(newHashedPassword: HashedPassword): PasswordUser {
//     return new PasswordUser(
//       this.id,
//       this.emailAddress,
//       newHashedPassword,
//       this.createdAt,
//       new Date() // updatedAt更新
//     );
//   }
// }
