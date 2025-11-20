import { AuditLog } from '@/domains/audit/log/domain/model/entity/AuditLog.js'
import { UuidGenerator } from '@/domains/sharedDomains/infrastructure/id/UuidGenerator.js'
import { AuditLogIntegrationEventDTO } from '../dto/AuditLogIntegrationEventDTO.js'

/**
 * 🔹 イベント種別ごとの処理を担当する Handler のインターフェース。
 * 
 * - Application 層の責務として「どの AuditLog を保存するか」を決める。
 * - ドメインエンティティ AuditLog を生成して返す。
 */
export interface IAuditIntegrationHandler {
    handle(event: AuditLogIntegrationEventDTO, idGen: UuidGenerator): AuditLog
}
