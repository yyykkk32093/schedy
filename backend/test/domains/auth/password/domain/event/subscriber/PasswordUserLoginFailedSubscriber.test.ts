import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { PasswordSignInFailedEvent } from '@/domains/auth/password/domain/event/PasswordSignInFailedEvent.js'
import { PasswordSignInFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordSignInFailedSubscriber.js'
import { describe, expect, it, vi } from 'vitest'

describe('PasswordSignInFailedSubscriber', () => {
    it('ログイン失敗イベントを購読して handle が呼ばれる', async () => {
        // Arrange
        const bus = new DomainEventBus()
        const subscriber = new PasswordSignInFailedSubscriber()
        const spy = vi.spyOn(subscriber, 'handle')
        bus.subscribe(subscriber)

        const event = new PasswordSignInFailedEvent({
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
