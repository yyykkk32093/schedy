// sharedDomains/domain/audit/AuditRepository.ts
import type { AuditEvent } from './AuditEvent.js'

export interface AuditRepository {
    save(event: AuditEvent): Promise<void>
}
