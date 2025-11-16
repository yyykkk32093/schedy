// sharedDomains/domain/audit/AuditLogSubscriber.ts
import type { AuditRepository } from '@/domains/audit/AuditRepository.js'
import { PasswordUserLoggedInEvent } from '@/domains/auth/password/domain/event/PasswordUserLoggedInEvent.js'
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'

export class AuditLogSubscriber
    implements DomainEventSubscriber<PasswordUserLoggedInEvent> {
    constructor(private readonly auditRepo: AuditRepository) { }

    eventName(): string {
        return 'PasswordUserLoggedInEvent'
    }

    async handle(event: PasswordUserLoggedInEvent): Promise<void> {
        const auditEvent = {
            id: event.id,
            occurredAt: event.occurredAt,
            type: 'USER_LOGIN',
            userId: event.aggregateId,
            details: {
                email: event.email,
                ipAddress: event.ipAddress,
            },
        }
        await this.auditRepo.save(auditEvent)
    }
}
