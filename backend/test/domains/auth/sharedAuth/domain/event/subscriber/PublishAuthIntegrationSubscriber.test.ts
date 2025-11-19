import { AuthDomainEvent } from '@/domains/auth/sharedAuth/domain/event/AuthDomainEvent.js'
import { PublishAuthIntegrationSubscriber } from '@/domains/auth/sharedAuth/domain/event/integration/PublishAuthIntegrationSubscriber.js'
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { describe, expect, it, vi } from 'vitest'

// ---- ダミーイベント（テスト用のFake） ----
class FakeSuccessEvent extends AuthDomainEvent {
    readonly outcome = 'SUCCESS'
    readonly userId = 'u001'
    readonly email = 'user@example.com'
    readonly authMethod = 'password'
    readonly ipAddress = '127.0.0.1'

    constructor() {
        super('PasswordUserLoggedInEvent', 'u001')
    }
}

class FakeFailureEvent extends AuthDomainEvent {
    readonly outcome = 'FAILURE'
    readonly userId = 'u002'
    readonly email = 'user@example.com'
    readonly authMethod = 'password'
    readonly ipAddress = '127.0.0.1'
    readonly reason = 'INVALID_CREDENTIALS'

    constructor() {
        super('PasswordUserLoginFailedEvent', 'u002')
    }
}

describe('PublishAuthIntegrationSubscriber', () => {
    it('SUCCESSイベントをOutboxに保存する', async () => {
        const saveSpy = vi.fn()
        const repo: IOutboxRepository = {
            save: saveSpy,
            findPending: vi.fn(),
            markAsPublished: vi.fn(),
            markAsFailed: vi.fn(),
        }

        const subscriber = new PublishAuthIntegrationSubscriber(repo)
        const event = new FakeSuccessEvent()

        await subscriber.handle(event)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        const savedEvent = saveSpy.mock.calls[0][0]

        expect(savedEvent.eventName).toBe('UserLoggedInIntegrationEvent')
    })

    it('FAILUREイベントをOutboxに保存する', async () => {
        const saveSpy = vi.fn()
        const repo: IOutboxRepository = {
            save: saveSpy,
            findPending: vi.fn(),
            markAsPublished: vi.fn(),
            markAsFailed: vi.fn(),
        }

        const subscriber = new PublishAuthIntegrationSubscriber(repo)
        const event = new FakeFailureEvent()

        await subscriber.handle(event)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        const savedEvent = saveSpy.mock.calls[0][0]

        expect(savedEvent.eventName).toBe('UserLoginFailedIntegrationEvent')
    })
})
