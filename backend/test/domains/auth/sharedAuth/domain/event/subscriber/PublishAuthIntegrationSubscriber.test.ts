import { describe, expect, it } from 'vitest'

import { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'
import { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'

describe('IntegrationEventFactory (auth login contract)', () => {
    it('UserLoginSucceededEvent を IntegrationEvent に変換できる（現行互換）', async () => {
        const factory = new IntegrationEventFactory()
        const event = new UserLoginSucceededEvent({
            userId: UserId.create('u001'),
            email: EmailAddress.create('user@example.com'),
            method: 'password',
            ipAddress: '127.0.0.1',
        })

        const integrationEvents = factory.createManyFrom(event)

        expect(integrationEvents).toHaveLength(1)
        const integrationEvent = integrationEvents[0]
        expect(integrationEvent.sourceEventName).toBe('UserLoginSucceededEvent')
        expect(integrationEvent.sourceEventId).toBe(event.id)
        expect(integrationEvent.eventType).toBe('auth.login.success')
        expect(integrationEvent.routingKey).toBe('audit.log')
        expect(integrationEvent.idempotencyKey).toBe(
            `${event.id}:audit.log:auth.login.success`
        )
        expect(integrationEvent.payload).toMatchObject({
            userId: 'u001',
            email: 'user@example.com',
            authMethod: 'password',
            ipAddress: '127.0.0.1',
        })
    })

    it('UserLoginFailedEvent を IntegrationEvent に変換できる（現行互換）', async () => {
        const factory = new IntegrationEventFactory()
        const event = new UserLoginFailedEvent({
            email: EmailAddress.create('user@example.com'),
            reason: 'INVALID_CREDENTIALS',
            method: 'password',
            userId: UserId.create('u002'),
            ipAddress: '127.0.0.1',
        })

        const integrationEvents = factory.createManyFrom(event)

        expect(integrationEvents).toHaveLength(1)
        const integrationEvent = integrationEvents[0]
        expect(integrationEvent.sourceEventName).toBe('UserLoginFailedEvent')
        expect(integrationEvent.sourceEventId).toBe(event.id)
        expect(integrationEvent.eventType).toBe('auth.login.failed')
        expect(integrationEvent.routingKey).toBe('audit.log')
        expect(integrationEvent.idempotencyKey).toBe(
            `${event.id}:audit.log:auth.login.failed`
        )
        expect(integrationEvent.payload).toMatchObject({
            userId: 'u002',
            email: 'user@example.com',
            authMethod: 'password',
            reason: 'INVALID_CREDENTIALS',
            ipAddress: '127.0.0.1',
        })
    })
})
