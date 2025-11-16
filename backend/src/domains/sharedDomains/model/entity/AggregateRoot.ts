import { BaseDomainEvent } from '@/domains/sharedDomains/domain/event/BaseDomainEvent.js'

/**
 * 集約ルート基底クラス。
 * ドメインイベントを内部に蓄積して、アプリケーション層で一括発火できるようにする。
 */
export abstract class AggregateRoot {
    private readonly domainEvents: BaseDomainEvent[] = []

    /** ドメインイベントを追加 */
    protected addDomainEvent(event: BaseDomainEvent): void {
        this.domainEvents.push(event)
    }

    /** 蓄積されたイベントを取得してクリア */
    public pullDomainEvents(): BaseDomainEvent[] {
        const events = [...this.domainEvents]
        this.domainEvents.length = 0 // flush
        return events
    }
}
