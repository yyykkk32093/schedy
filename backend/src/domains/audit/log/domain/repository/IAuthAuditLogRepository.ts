import type { AuthAuditLog } from '../model/entity/AuthAuditLog.js'

/**
 * AuthAuditLog 永続化用リポジトリの抽象契約。
 * - TX内で使用される（PrismaClientLike を受け取る実装）
 */
export interface IAuthAuditLogRepository {
    save(log: AuthAuditLog): Promise<void>
}
