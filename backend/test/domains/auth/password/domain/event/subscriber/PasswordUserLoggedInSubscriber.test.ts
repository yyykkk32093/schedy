import { PasswordUserLoggedInEvent } from '@/domains/auth/password/domain/event/PasswordUserLoggedInEvent.js'
import { PasswordUserLoggedInSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.js'
import { DomainEventBus } from '@/domains/sharedDomains/domain/event/DomainEventBus.js'
import { describe, expect, it, vi } from 'vitest'

describe('PasswordUserLoggedInSubscriber', () => {
    it('ログイン成功イベントを購読して handle が呼ばれる', async () => {
        // Arrange
        const bus = new DomainEventBus()
        const subscriber = new PasswordUserLoggedInSubscriber()
        const spy = vi.spyOn(subscriber, 'handle')
        bus.subscribe(subscriber)

        const event = new PasswordUserLoggedInEvent({
            userId: 'user-001',
            email: 'user@example.com',
            ipAddress: '127.0.0.1',
        })

        // Act
        await bus.publish(event)

        // Assert
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(event)
    })
})
