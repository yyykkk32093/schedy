// src/domains/audit/log/IAuditLogRepository.ts

import { AuditLog } from "../model/entity/AuditLog.js"

/**
 * 🔹 AuditLog永続化用リポジトリの抽象契約。
 */
export interface IAuditLogRepository {
    save(log: AuditLog): Promise<void>
    findByUserId(userId: string): Promise<AuditLog[]>
}
