import { describe, expect, it } from 'vitest'

import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { AccountLinkRequiredError } from '@/application/auth/error/AccountLinkRequiredError.js'
import { SignInOAuthUserUseCase } from '@/application/auth/oauth/usecase/SignInOAuthUserUseCase.js'
import { RegisterUserService } from '@/application/user/service/RegisterUserService.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { User } from '@/domains/user/domain/model/entity/User.js'
import { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import type {
    IOAuthProviderClient,
    OAuthProfile,
} from '@/integration/oauth/IOAuthProviderClient.js'

class FakeOutboxRepository {
    events: any[] = []

    snapshot() {
        return { events: [...this.events] }
    }

    restore(s: { events: any[] }) {
        this.events = [...s.events]
    }

    async saveMany(events: any[]) {
        this.events.push(...events)
    }

    // unused in these tests
    async save(): Promise<void> {
        throw new Error('not implemented')
    }
    async findPending(): Promise<any[]> {
        throw new Error('not implemented')
    }
    async markAsPublished(): Promise<void> {
        throw new Error('not implemented')
    }
    async markAsFailed(): Promise<void> {
        throw new Error('not implemented')
    }
    async incrementRetryCount(): Promise<void> {
        throw new Error('not implemented')
    }
    async updateNextRetryAt(): Promise<void> {
        throw new Error('not implemented')
    }
}

class FakeUserRepository {
    private byId = new Map<string, User>()
    private byEmail = new Map<string, User>()

    snapshot() {
        return {
            byId: new Map(this.byId),
            byEmail: new Map(this.byEmail),
        }
    }

    restore(s: { byId: Map<string, User>; byEmail: Map<string, User> }) {
        this.byId = new Map(s.byId)
        this.byEmail = new Map(s.byEmail)
    }

    async findById(id: string): Promise<User | null> {
        return this.byId.get(id) ?? null
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.byEmail.get(email) ?? null
    }

    async save(user: User): Promise<void> {
        this.byId.set(user.getId().getValue(), user)
        const email = user.getEmail()?.getValue()
        if (email) {
            this.byEmail.set(email, user)
        }
    }
}

class FakeAuthSecurityStateRepository {
    private lockedUntilByUserId = new Map<string, Date | null>()

    snapshot() {
        return { lockedUntilByUserId: new Map(this.lockedUntilByUserId) }
    }

    restore(s: { lockedUntilByUserId: Map<string, Date | null> }) {
        this.lockedUntilByUserId = new Map(s.lockedUntilByUserId)
    }

    async findByUserId(params: { userId: string }) {
        const lockedUntil = this.lockedUntilByUserId.get(params.userId)
        if (lockedUntil === undefined) return null
        return { failedSignInCount: 0, lockedUntil }
    }

    // unused
    async recordLoginSuccess(): Promise<void> {
        throw new Error('not implemented')
    }
    async recordLoginFailure(): Promise<void> {
        throw new Error('not implemented')
    }
}

class FakeGoogleCredentialRepository {
    private map = new Map<string, string>()

    snapshot() {
        return { map: new Map(this.map) }
    }

    restore(s: { map: Map<string, string> }) {
        this.map = new Map(s.map)
    }

    async findUserIdByGoogleUid(params: { googleUid: string }): Promise<string | null> {
        return this.map.get(params.googleUid) ?? null
    }

    async link(params: { userId: string; googleUid: string }): Promise<void> {
        this.map.set(params.googleUid, params.userId)
    }
}

class FakeLineCredentialRepository {
    private map = new Map<string, string>()

    snapshot() {
        return { map: new Map(this.map) }
    }

    restore(s: { map: Map<string, string> }) {
        this.map = new Map(s.map)
    }

    async findUserIdByLineUid(params: { lineUid: string }): Promise<string | null> {
        return this.map.get(params.lineUid) ?? null
    }

    async link(params: { userId: string; lineUid: string }): Promise<void> {
        this.map.set(params.lineUid, params.userId)
    }
}

class FakeAppleCredentialRepository {
    private map = new Map<string, string>()

    snapshot() {
        return { map: new Map(this.map) }
    }

    restore(s: { map: Map<string, string> }) {
        this.map = new Map(s.map)
    }

    async findUserIdByAppleUid(params: { appleUid: string }): Promise<string | null> {
        return this.map.get(params.appleUid) ?? null
    }

    async link(params: { userId: string; appleUid: string }): Promise<void> {
        this.map.set(params.appleUid, params.userId)
    }
}

class FakeUnitOfWork<TRepos extends Record<string, any>> implements IUnitOfWorkWithRepos<TRepos> {
    constructor(private readonly repos: TRepos) { }

    async run<T>(fn: (repos: TRepos) => Promise<T>): Promise<T> {
        const snapshots = new Map<string, any>()

        for (const [key, repo] of Object.entries(this.repos)) {
            if (repo && typeof repo.snapshot === 'function') {
                snapshots.set(key, repo.snapshot())
            }
        }

        try {
            return await fn(this.repos)
        } catch (err) {
            for (const [key, snap] of snapshots.entries()) {
                const repo = (this.repos as any)[key]
                if (repo && typeof repo.restore === 'function') {
                    repo.restore(snap)
                }
            }
            throw err
        }
    }
}

class FakeEventPublisher {
    events: any[] = []
    async publish(event: any) {
        this.events.push(event)
    }
}

class FakeProviderClient implements IOAuthProviderClient {
    constructor(
        public readonly provider: 'google' | 'line' | 'apple',
        private readonly profile: Omit<OAuthProfile, 'provider'>
    ) { }

    async fetchProfile(): Promise<OAuthProfile> {
        return { provider: this.provider, ...this.profile }
    }
}

describe('SignInOAuthUserUseCase', () => {
    it('初回OAuthログインでUser作成 + credential link + outbox(registered+login)', async () => {
        const userRepo = new FakeUserRepository()
        const outboxRepo = new FakeOutboxRepository()
        const authSecurityStateRepo = new FakeAuthSecurityStateRepository()
        const googleCredRepo = new FakeGoogleCredentialRepository()
        const lineCredRepo = new FakeLineCredentialRepository()
        const appleCredRepo = new FakeAppleCredentialRepository()

        const uow = new FakeUnitOfWork({
            user: userRepo,
            outbox: outboxRepo,
            authSecurityState: authSecurityStateRepo,
            googleCredential: googleCredRepo,
            lineCredential: lineCredRepo,
            appleCredential: appleCredRepo,
        })

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )

        const publisher = new FakeEventPublisher()

        const usecase = new SignInOAuthUserUseCase(
            new UuidGenerator(),
            uow as any,
            registerUserService,
            integrationEventFactory,
            outboxEventFactory,
            publisher as any,
            new JwtTokenService('test-secret'),
            {
                password: undefined,
                google: new FakeProviderClient('google', {
                    providerUserId: 'g-001',
                    email: 'new@example.com',
                    displayName: 'New',
                }),
                line: undefined,
                apple: undefined,
            }
        )

        const result = await usecase.execute({
            provider: 'google',
            code: 'dummy-code',
        })

        expect(result.userId).toBeTruthy()
        expect(result.accessToken).toBeTruthy()

        // UserRegistered (fan-out 2) + auth.login.success (1)
        expect(outboxRepo.events.length).toBe(3)
        expect(outboxRepo.events.map((e) => e.eventType).sort()).toEqual(
            ['auth.login.success', 'user.registered', 'user.registered'].sort()
        )

        // credential link
        expect(
            await googleCredRepo.findUserIdByGoogleUid({ googleUid: 'g-001' })
        ).toBe(result.userId)

        // publish called
        expect(publisher.events.length).toBe(1)
        expect(publisher.events[0].eventName).toBe('UserLoginSucceededEvent')
    })

    it('既存credentialがあれば既存Userでログイン成功', async () => {
        const userRepo = new FakeUserRepository()
        const outboxRepo = new FakeOutboxRepository()
        const authSecurityStateRepo = new FakeAuthSecurityStateRepository()
        const googleCredRepo = new FakeGoogleCredentialRepository()
        const lineCredRepo = new FakeLineCredentialRepository()
        const appleCredRepo = new FakeAppleCredentialRepository()

        const existing = User.create({ id: 'u-001', email: null })
        await userRepo.save(existing)
        await googleCredRepo.link({ userId: 'u-001', googleUid: 'g-001' })

        const uow = new FakeUnitOfWork({
            user: userRepo,
            outbox: outboxRepo,
            authSecurityState: authSecurityStateRepo,
            googleCredential: googleCredRepo,
            lineCredential: lineCredRepo,
            appleCredential: appleCredRepo,
        })

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )
        const publisher = new FakeEventPublisher()

        const usecase = new SignInOAuthUserUseCase(
            new UuidGenerator(),
            uow as any,
            registerUserService,
            integrationEventFactory,
            outboxEventFactory,
            publisher as any,
            new JwtTokenService('test-secret'),
            {
                password: undefined,
                google: new FakeProviderClient('google', {
                    providerUserId: 'g-001',
                    email: null,
                    displayName: null,
                }),
                line: undefined,
                apple: undefined,
            }
        )

        const result = await usecase.execute({
            provider: 'google',
            code: 'dummy-code',
        })

        expect(result.userId).toBe('u-001')
        expect(outboxRepo.events.length).toBe(1)
        expect(outboxRepo.events[0].eventType).toBe('auth.login.success')
    })

    it('emailが既存Userと衝突した場合はACCOUNT_LINK_REQUIRED（自動リンクしない）', async () => {
        const userRepo = new FakeUserRepository()
        const outboxRepo = new FakeOutboxRepository()
        const authSecurityStateRepo = new FakeAuthSecurityStateRepository()
        const googleCredRepo = new FakeGoogleCredentialRepository()
        const lineCredRepo = new FakeLineCredentialRepository()
        const appleCredRepo = new FakeAppleCredentialRepository()

        const existing = User.create({ id: 'u-001', email: 'exists@example.com' })
        await userRepo.save(existing)

        const uow = new FakeUnitOfWork({
            user: userRepo,
            outbox: outboxRepo,
            authSecurityState: authSecurityStateRepo,
            googleCredential: googleCredRepo,
            lineCredential: lineCredRepo,
            appleCredential: appleCredRepo,
        })

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )
        const publisher = new FakeEventPublisher()

        const usecase = new SignInOAuthUserUseCase(
            new UuidGenerator(),
            uow as any,
            registerUserService,
            integrationEventFactory,
            outboxEventFactory,
            publisher as any,
            new JwtTokenService('test-secret'),
            {
                password: undefined,
                google: new FakeProviderClient('google', {
                    providerUserId: 'g-002',
                    email: 'exists@example.com',
                    displayName: null,
                }),
                line: undefined,
                apple: undefined,
            }
        )

        await expect(
            usecase.execute({ provider: 'google', code: 'dummy-code' })
        ).rejects.toBeInstanceOf(AccountLinkRequiredError)

        // tx rollbackでoutboxは増えない
        expect(outboxRepo.events.length).toBe(0)
        expect(
            await googleCredRepo.findUserIdByGoogleUid({ googleUid: 'g-002' })
        ).toBe(null)
    })
})
