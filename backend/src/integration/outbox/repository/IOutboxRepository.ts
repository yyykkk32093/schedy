// src/domains/_sharedDomains/domain/integration/IOutboxRepository.ts

import { OutboxEvent } from "../model/entity/OutboxEvent.js"

export interface IOutboxRepository {
    save(event: OutboxEvent): Promise<void>

    /**
     * 同一のIntegrationSourceから生成された配送指示集合を、部分成功なしで保存する。
     * - tx-scope repository で呼ばれることを想定（UoW内で原子化）
     */
    saveMany(events: OutboxEvent[]): Promise<void>

    findPending(limit?: number): Promise<OutboxEvent[]>

    markAsPublished(outboxEventId: string): Promise<void>

    markAsFailed(outboxEventId: string): Promise<void>

    incrementRetryCount(outboxEventId: string): Promise<void>

    updateNextRetryAt(outboxEventId: string, nextRetryAt: Date): Promise<void>
}
