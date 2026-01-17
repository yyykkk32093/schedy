import { describe, expect, it } from 'vitest'

import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'

describe('OutboxEventFactory (auth login contract)', () => {
    it('UserLoginSucceededEvent を OutboxEvent に変換できる（現行互換）', async () => {
        const factory = new OutboxEventFactory()
        const event = new UserLoginSucceededEvent({
            userId: UserId.create('u001'),
            email: EmailAddress.create('user@example.com'),
            method: 'password',
            ipAddress: '127.0.0.1',
        })

        const outboxEvents = factory.createManyFrom(event)

        expect(outboxEvents).toHaveLength(1)
        const outboxEvent = outboxEvents[0]
        expect(outboxEvent.eventName).toBe('UserLoginSucceededEvent')
        expect(outboxEvent.eventType).toBe('auth.login.success')
        expect(outboxEvent.routingKey).toBe('audit.log')
        expect(outboxEvent.payload).toMatchObject({
            userId: 'u001',
            email: 'user@example.com',
            authMethod: 'password',
            ipAddress: '127.0.0.1',
        })
    })

    it('UserLoginFailedEvent を OutboxEvent に変換できる（現行互換）', async () => {
        const factory = new OutboxEventFactory()
        const event = new UserLoginFailedEvent({
            email: EmailAddress.create('user@example.com'),
            reason: 'INVALID_CREDENTIALS',
            method: 'password',
            userId: UserId.create('u002'),
            ipAddress: '127.0.0.1',
        })

        const outboxEvents = factory.createManyFrom(event)

        expect(outboxEvents).toHaveLength(1)
        const outboxEvent = outboxEvents[0]
        expect(outboxEvent.eventName).toBe('UserLoginFailedEvent')
        expect(outboxEvent.eventType).toBe('auth.login.failed')
        expect(outboxEvent.routingKey).toBe('audit.log')
        expect(outboxEvent.payload).toMatchObject({
            userId: 'u002',
            email: 'user@example.com',
            authMethod: 'password',
            reason: 'INVALID_CREDENTIALS',
            ipAddress: '127.0.0.1',
        })
    })
})
