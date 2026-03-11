import type { ParticipationAuditLog } from '../model/entity/ParticipationAuditLog.js'

export interface IParticipationAuditLogRepository {
    save(log: ParticipationAuditLog): Promise<void>
}
