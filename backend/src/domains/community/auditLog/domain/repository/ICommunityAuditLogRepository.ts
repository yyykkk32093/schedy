import type { CommunityAuditLog } from '../model/entity/CommunityAuditLog.js'

export interface ICommunityAuditLogRepository {
    save(log: CommunityAuditLog): Promise<void>

    findByCommunityId(communityId: string, limit?: number): Promise<CommunityAuditLog[]>
}
