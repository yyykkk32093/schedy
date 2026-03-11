import type { WaitlistAuditLog } from '../model/entity/WaitlistAuditLog.js'

export interface IWaitlistAuditLogRepository {
    save(log: WaitlistAuditLog): Promise<void>
}
