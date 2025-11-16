import { PasswordUserLoginFailedEvent } from '@/domains/auth/password/domain/event/PasswordUserLoginFailedEvent.js'
import { PasswordUserLoginFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.js'
import { DomainEventBus } from '@/domains/sharedDomains/domain/event/DomainEventBus.js'
import { describe, expect, it, vi } from 'vitest'

describe('PasswordUserLoginFailedSubscriber', () => {
    it('ログイン失敗イベントを購読して handle が呼ばれる', async () => {
        // Arrange
        const bus = new DomainEventBus()
        const subscriber = new PasswordUserLoginFailedSubscriber()
        const spy = vi.spyOn(subscriber, 'handle')
        bus.subscribe(subscriber)

        const event = new PasswordUserLoginFailedEvent({
            userId: 'user-002',
            email: 'user@example.com',
            reason: 'INVALID_CREDENTIALS',
            ipAddress: '127.0.0.1',
        })

        // Act
        await bus.publish(event)

        // Assert
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(event)
    })
})
