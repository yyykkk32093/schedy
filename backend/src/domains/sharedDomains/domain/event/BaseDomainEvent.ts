import { randomUUID } from 'crypto'

/**
 * 全てのドメインイベントが継承する基底クラス。
 * 不変オブジェクトとして扱い、過去の事実を表す。
 */
export abstract class BaseDomainEvent {
    /** イベントID（ユニーク識別子） */
    readonly id: string

    /** イベント名（クラス名や識別キー） */
    readonly eventName: string

    /** イベント発生日時 */
    readonly occurredAt: Date

    /** 発生元エンティティのID（任意） */
    readonly aggregateId?: string

    protected constructor(eventName: string, aggregateId?: string) {
        this.id = randomUUID()
        this.eventName = eventName
        this.occurredAt = new Date()
        this.aggregateId = aggregateId
    }
}
