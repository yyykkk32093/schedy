// test/application/auth/password/usecase/LoginPasswordUserUseCase.test.ts

import { LoginPasswordUserUseCase } from '@/application/auth/password/usecase/LoginPasswordUserUseCase.js'
import { PasswordUserLoggedInSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.js'
import { PasswordUserLoginFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.js'
import { PasswordUser } from '@/domains/auth/password/domain/model/entity/PasswordUser.js'
import { authDomainEventBus } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEventBus.js'
import { registerAuthDomainSubscribers } from '@/domains/auth/sharedAuth/domain/event/AuthEventRegistry.js'
import { HashedPassword } from '@/domains/auth/sharedAuth/model/valueObject/HashedPassword.js'
import { EmailAddress } from '@/domains/sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/sharedDomains/model/valueObject/UserId.js'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const mockUserRepository = { findByEmail: vi.fn() }
const mockHasher = { compare: vi.fn() }

beforeAll(() => {
    registerAuthDomainSubscribers()
})

describe('LoginPasswordUserUseCase Integration', () => {
    it('ログイン成功時に Subscriber が呼ばれる', async () => {
        const bus = authDomainEventBus
        const loggedSpy = vi.spyOn(
            PasswordUserLoggedInSubscriber.prototype,
            'handle'
        )

        const user = new PasswordUser(
            new UserId('u001'),
            new EmailAddress('user@example.com'),
            new HashedPassword('$2a$10$dummyhashdummyhashdummyhash'),
            new Date(),
            new Date()
        )

        mockUserRepository.findByEmail.mockResolvedValue(user)
        mockHasher.compare.mockResolvedValue(true)

        const usecase = new LoginPasswordUserUseCase(
            mockUserRepository as any,
            mockHasher as any,
            bus
        )

        const result = await usecase.execute({
            email: 'user@example.com',
            password: 'correct-password',
        })

        expect(result.userId).toBe('u001')
        expect(loggedSpy).toHaveBeenCalledTimes(1)
    })

    it('ログイン失敗時（INVALID_CREDENTIALS）に Subscriber が呼ばれる', async () => {
        const bus = authDomainEventBus
        const failedSpy = vi.spyOn(
            PasswordUserLoginFailedSubscriber.prototype,
            'handle'
        )

        const user = new PasswordUser(
            new UserId('u002'),
            new EmailAddress('user@example.com'),
            new HashedPassword('$2a$10$dummyhashdummyhashdummyhash'),
            new Date(),
            new Date()
        )

        mockUserRepository.findByEmail.mockResolvedValue(user)
        mockHasher.compare.mockResolvedValue(false)

        const usecase = new LoginPasswordUserUseCase(
            mockUserRepository as any,
            mockHasher as any,
            bus
        )

        await expect(
            usecase.execute({
                email: 'user@example.com',
                password: 'wrong-password',
            })
        ).rejects.toThrow('パスワードが一致しません')

        expect(failedSpy).toHaveBeenCalledTimes(1)
    })
})




// import { LoginPasswordUserUseCase } from '@/application/auth/password/usecase/LoginPasswordUserUseCase.js';
// import { PasswordUserRepositoryImpl } from '@/domains/auth/password/infrastructure/repository/PasswordUserRepositoryImpl.js';
// import { BcryptPasswordHasher } from '@/domains/auth/sharedAuth/infrastructure/security/BcryptPasswordHasher.js';
// import { describe, expect, it } from 'vitest';



// describe('LoginPasswordUserUseCase', () => {
//     const useCase = new LoginPasswordUserUseCase(
//         new PasswordUserRepositoryImpl(),
//         new BcryptPasswordHasher()
//     );

//     it('ログイン成功', async () => {
//         const result = await useCase.execute({
//             email: 'test@example.com',
//             password: 'password123',
//         });

//         expect(result).toHaveProperty('userId');
//         expect(result).toHaveProperty('accessToken');
//     });

//     it('存在しないユーザー', async () => {
//         await expect(
//             useCase.execute({
//                 email: 'notfound@example.com',
//                 password: 'password123',
//             })
//         ).rejects.toThrow('ユーザーが存在しません');
//     });

//     it('パスワード不一致', async () => {
//         await expect(
//             useCase.execute({
//                 email: 'test@example.com',
//                 password: 'password1234',
//             })
//         ).rejects.toThrow('パスワードが一致しません');
//     });
// });



// import { describe, expect, it, vi } from 'vitest'
// import { LoginPasswordUserUseCase } from '@/application/auth/password/usecase/LoginPasswordUserUseCase'

// // モック生成
// const mockRepo = {
//   findByEmail: vi.fn(),
// }
// const mockHasher = {
//   compare: vi.fn(),
// }

// describe('LoginPasswordUserUseCase', () => {
//   const useCase = new LoginPasswordUserUseCase(
//     mockRepo as any,
//     mockHasher as any
//   )

//   it('ログイン成功', async () => {
//     mockRepo.findByEmail.mockResolvedValue({ id: 'user-1', password: 'hashedpw' })
//     mockHasher.compare.mockResolvedValue(true)

//     const result = await useCase.execute({
//       email: 'test@example.com',
//       password: 'password123',
//     })

//     expect(result).toEqual({
//       userId: 'user-1',
//       accessToken: expect.any(String),
//     })
//   })

//   it('存在しないユーザー', async () => {
//     mockRepo.findByEmail.mockResolvedValue(null)

//     await expect(
//       useCase.execute({
//         email: 'notfound@example.com',
//         password: 'password123',
//       })
//     ).rejects.toThrow('ユーザーが存在しません')
//   })

//   it('パスワード不一致', async () => {
//     mockRepo.findByEmail.mockResolvedValue({ id: 'user-1', password: 'hashedpw' })
//     mockHasher.compare.mockResolvedValue(false)

//     await expect(
//       useCase.execute({
//         email: 'test@example.com',
//         password: 'password1234',
//       })
//     ).rejects.toThrow('パスワードが一致しません')
//   })
// })
