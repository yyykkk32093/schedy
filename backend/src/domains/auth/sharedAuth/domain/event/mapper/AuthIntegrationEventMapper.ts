// src/domains/auth/sharedAuth/domain/event/mapper/AuthIntegrationEventMapper.ts
import { UserLoggedInIntegrationEvent } from '../integration/UserLoggedInIntegrationEvent.js'
import { UserLoginFailedIntegrationEvent } from '../integration/UserLoginFailedIntegrationEvent.js'

export class AuthIntegrationEventMapper {
    map(event: any) {
        const occurredAt = new Date()

        switch (event.eventName) {
            case 'PasswordUserLoggedInEvent':
                return new UserLoggedInIntegrationEvent({
                    userId: event.userId,
                    email: event.email,
                    ipAddress: event.ipAddress,
                    authMethod: event.authMethod,
                    occurredAt,
                    routingKey: 'audit.record-auth-log', // ← これ
                })

            case 'PasswordUserLoginFailedEvent':
                return new UserLoginFailedIntegrationEvent({
                    userId: event.userId,
                    email: event.email,
                    reason: event.reason,
                    authMethod: event.authMethod,
                    ipAddress: event.ipAddress,
                    occurredAt,
                    routingKey: 'audit.record-auth-log', // ← これ
                })

            default:
                throw new Error(`Mapper does not support ${event.eventName}`)
        }
    }
}
