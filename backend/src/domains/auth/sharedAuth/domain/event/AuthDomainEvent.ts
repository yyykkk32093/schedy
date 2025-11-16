// src/domains/auth/sharedAuth/domain/event/AuthDomainEvent.ts
import { BaseDomainEvent } from '@/domains/sharedDomains/domain/event/BaseDomainEvent.js'

/**
 * Authドメインに属する全イベントの抽象基底クラス。
 * 
 * 共通のドメインルールのみ保持。
 * outcome（SUCCESS/FAILURE）をサブクラスで明示する。
 */
export abstract class AuthDomainEvent extends BaseDomainEvent {
    readonly category = 'auth'
    abstract readonly outcome: 'SUCCESS' | 'FAILURE'

    protected constructor(eventName: string, aggregateId: string) {
        super(eventName, aggregateId)
    }
}
