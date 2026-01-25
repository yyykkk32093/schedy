import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'

import { UserRegisteredEvent } from '@/domains/user/domain/event/UserRegisteredEvent.js'
import { UserRegisteredSubscriber } from '@/domains/user/domain/event/subscriber/UserRegisteredSubscriber.js'

import { describe, expect, it, vi } from 'vitest'

describe('UserRegisteredSubscriber', () => {
    it('UserRegisteredEvent を購読して handle が呼ばれる', async () => {
        const bus = new DomainEventBus()
        const subscriber = new UserRegisteredSubscriber()
        const spy = vi.spyOn(subscriber, 'handle')

        bus.subscribe(subscriber)

        const event = new UserRegisteredEvent({
            userId: UserId.create('user-001'),
            email: EmailAddress.create('user@example.com'),
            authMethod: 'password',
        })

        await bus.publish(event)

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(event)
    })
})
