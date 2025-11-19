// src/application/auth/password/usecase/LoginPasswordUserUseCase.ts
import type { IPasswordUserRepository } from '@/domains/auth/password/domain/repository/IPasswordUserRepository.js'
import { PlainPassword } from '@/domains/auth/sharedAuth/model/valueObject/PlainPassword.js'
import type { IPasswordHasher } from '@/domains/auth/sharedAuth/service/security/IPasswordHasher.js'
import { DomainEventPublisher } from '@/domains/sharedDomains/domain/event/DomainEventPublisher.js'
import { EmailAddress } from '@/domains/sharedDomains/model/valueObject/EmailAddress.js'
import { LoginPasswordUserInput, LoginPasswordUserOutput } from '../dto/LoginPasswordUserDTO.js'

export class LoginPasswordUserUseCase {
    constructor(
        private readonly userRepository: IPasswordUserRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly eventPublisher: DomainEventPublisher
    ) { }

    public async execute(input: LoginPasswordUserInput): Promise<LoginPasswordUserOutput> {
        const email = new EmailAddress(input.email)
        const user = await this.userRepository.findByEmail(email)
        if (!user) throw new Error('ユーザーが存在しません')

        const ok = await user.tryLogin(new PlainPassword(input.password), this.passwordHasher)

        await this.eventPublisher.publishAll(user.pullDomainEvents())

        if (!ok) throw new Error('パスワードが一致しません')

        const token = 'dummy-token'
        return { userId: user.id.getValue(), accessToken: token }
    }
}





// import { PasswordUserLoggedInEvent } from '@/domains/auth/password/domain/event/PasswordUserLoggedInEvent.js'
// import { PasswordUserLoginFailedEvent } from '@/domains/auth/password/domain/event/PasswordUserLoginFailedEvent.js'
// import type { IPasswordUserRepository } from '@/domains/auth/password/domain/repository/IPasswordUserRepository.js'
// import { authDomainEventBus } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEventBus.js'
// import { PlainPassword } from '@/domains/auth/sharedAuth/model/valueObject/PlainPassword.js'
// import type { IPasswordHasher } from '@/domains/auth/sharedAuth/service/security/IPasswordHasher.js'
// import { DomainEventPublisher } from '@/domains/sharedDomains/domain/event/DomainEventPublisher.js'
// import { EmailAddress } from '@/domains/sharedDomains/model/valueObject/EmailAddress.js'
// import { LoginPasswordUserInput, LoginPasswordUserOutput } from '../dto/LoginPasswordUserDTO.js'


// /**
//  * ログインユースケース
//  * - メールアドレスでユーザーを検索
//  * - パスワードを検証
//  * - 成功／失敗をイベントとして発火
//  */
// export class LoginPasswordUserUseCase {
//     constructor(
//         private readonly userRepository: IPasswordUserRepository,
//         private readonly passwordHasher: IPasswordHasher,
//         private readonly eventPublisher: DomainEventPublisher = authDomainEventBus
//     ) { }

//     public async execute(input: LoginPasswordUserInput): Promise<LoginPasswordUserOutput> {
//         const email = new EmailAddress(input.email)
//         const user = await this.userRepository.findByEmail(email)

//         // ❌ ユーザー存在せず → イベント発火
//         if (!user) {
//             await this.eventPublisher.publish(
//                 new PasswordUserLoginFailedEvent({
//                     userId: 'unknown',
//                     email: input.email,
//                     reason: 'NOT_FOUND',
//                     ipAddress: input.ipAddress,
//                 })
//             )
//             throw new Error('ユーザーが存在しません')
//         }

//         const isValid = await user.isPasswordValid(new PlainPassword(input.password), this.passwordHasher)

//         // ❌ パスワード不一致 → イベント発火
//         if (!isValid) {
//             await this.eventPublisher.publish(
//                 new PasswordUserLoginFailedEvent({
//                     userId: user.id.getValue(),
//                     email: input.email,
//                     reason: 'INVALID_CREDENTIALS',
//                     ipAddress: input.ipAddress,
//                 })
//             )
//             throw new Error('パスワードが一致しません')
//         }

//         // ✅ 認証成功 → イベント発火
//         await this.eventPublisher.publish(
//             new PasswordUserLoggedInEvent({
//                 userId: user.id.getValue(),
//                 email: input.email,
//                 ipAddress: input.ipAddress,
//             })
//         )

//         // JWT発行処理（仮）
//         const token = 'dummy-token' // TODO: JWT発行に置き換え

//         return {
//             userId: user.id.getValue(),
//             accessToken: token,
//         }
//     }
// }


// import { EmailAddress } from '@/domains/sharedDomains/model/valueObject/EmailAddress.js';
// import type { IPasswordUserRepository } from '../../../../domains/auth/password/domain/repository/IPasswordUserRepository.js';
// import { PlainPassword } from '../../../../domains/auth/sharedAuth/model/valueObject/PlainPassword.js';
// import type { IPasswordHasher } from '../../../../domains/auth/sharedAuth/service/security/IPasswordHasher.js';
// import { LoginPasswordUserInput, LoginPasswordUserOutput } from '../dto/LoginPasswordUserDTO.js';


// /**
//  * ログインユースケース
//  * - メールアドレスでユーザーを検索
//  * - パスワードを検証
//  * - 認証成功時にトークンなどを返す
//  */
// export class LoginPasswordUserUseCase {
//     constructor(
//         private readonly userRepository: IPasswordUserRepository,
//         private readonly passwordHasher: IPasswordHasher
//     ) { }

//     public async execute(input: LoginPasswordUserInput): Promise<LoginPasswordUserOutput> {
//         // ① メールアドレスでユーザーを検索
//         const email = new EmailAddress(input.email); // ← string → ValueObject 変換
//         const user = await this.userRepository.findByEmail(email);
//         if (!user) {
//             throw new Error('ユーザーが存在しません');
//         }

//         // ② パスワード照合
//         const isValid = await user.isPasswordValid(
//             new PlainPassword(input.password),
//             this.passwordHasher
//         );

//         if (!isValid) {
//             throw new Error('パスワードが一致しません');
//         }

//         // ③ トークンを生成（仮）
//         const token = 'dummy-token'; // TODO: JWT発行に置き換え予定

//         // ④ 結果をDTOで返す
//         return {
//             userId: user.id.getValue(),
//             accessToken: token,
//         };
//     }
// }
