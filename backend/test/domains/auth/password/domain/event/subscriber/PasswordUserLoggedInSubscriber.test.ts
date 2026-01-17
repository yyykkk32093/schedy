import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { PasswordSignInSucceededEvent } from '@/domains/auth/password/domain/event/PasswordSignInSucceededEvent.js'
import { PasswordSignInSucceededSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordSignInSucceededSubscriber.js'
import { describe, expect, it, vi } from 'vitest'

describe('PasswordSignInSucceededSubscriber', () => {
    it('ログイン成功イベントを購読して handle が呼ばれる', async () => {
        // Arrange
        const bus = new DomainEventBus()
        const subscriber = new PasswordSignInSucceededSubscriber()
        const spy = vi.spyOn(subscriber, 'handle')
        bus.subscribe(subscriber)

        const event = new PasswordSignInSucceededEvent({
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
