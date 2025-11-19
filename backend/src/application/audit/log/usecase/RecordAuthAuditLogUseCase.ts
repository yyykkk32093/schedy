// src/application/audit/log/usecase/RecordAuthAuditLogUseCase.ts
import { AuditLog } from '@/domains/audit/log/domain/model/entity/AuditLog.js'
import { AuditLogRepository } from '@/domains/audit/log/infrastructure/repository/AuditLogRepositoryImpl.js'
import { UuidGenerator } from '@/domains/sharedDomains/infrastructure/id/UuidGenerator.js'

/**
 * 🔹 Outbox経由で受信したAuthイベントを監査ログとして記録するユースケース。
 * 個人情報は含まず、イベントの基本属性のみを保存する。
 */
export class RecordAuthAuditLogUseCase {
    private readonly repo = new AuditLogRepository()
    private readonly idGenerator = new UuidGenerator()

    async execute(event: any): Promise<void> {
        console.log('[RecordAuthAuditLogUseCase] Received:', event.eventName)

        // ドメインエンティティ化（ID生成は抽象サービス経由）
        const log = AuditLog.fromIntegrationEvent(event, this.idGenerator)

        // リポジトリに保存
        await this.repo.save(log)
    }
}
