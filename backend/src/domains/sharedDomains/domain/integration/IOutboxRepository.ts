// src/domains/sharedDomains/domain/integration/IOutboxRepository.ts
import { OutboxEvent } from '@/domains/sharedDomains/infrastructure/outbox/OutboxEvent.js'

/**
 * OutboxRepository の抽象インターフェース。
 * 
 * ドメイン層やSubscriberはこのインターフェースにのみ依存し、
 * 具体的な保存手段（DB, ファイル, MQなど）は知らない。
 */
export interface IOutboxRepository {
    /**
     * Outboxイベントを保存する
     */
    save(event: OutboxEvent): Promise<void>

    /**
     * 未送信（PENDING）イベントを取得
     */
    findPending(limit?: number): Promise<OutboxEvent[]>

    /**
     * 成功済みイベントを更新
     */
    markAsPublished(id: string): Promise<void>

    /**
     * 送信失敗イベントを更新
     */
    markAsFailed(id: string): Promise<void>
}
