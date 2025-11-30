// domains/schedule/sharedSchedule/domain/event/ScheduleDomainEvent.ts
import { BaseDomainEvent } from '@/domains/sharedDomains/domain/event/BaseDomainEvent.js'

/**
 * Schedule ドメインに属する全イベントの抽象基底クラス。
 * 
 * 共通のメタ情報（category など）を保持する。
 */
export abstract class ScheduleDomainEvent extends BaseDomainEvent {
    readonly category = 'schedule'

    protected constructor(eventName: string, aggregateId: string) {
        super(eventName, aggregateId)
    }
}
