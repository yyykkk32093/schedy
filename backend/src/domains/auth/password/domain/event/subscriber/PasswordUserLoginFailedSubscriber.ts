// src/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { PasswordUserLoginFailedEvent } from '../PasswordUserLoginFailedEvent.js'

/**
 * PasswordUserLoginFailedEvent を購読し、副作用（ログ出力など）を実行するSubscriber。
 */
export class PasswordUserLoginFailedSubscriber
    implements DomainEventSubscriber<PasswordUserLoginFailedEvent> {
    eventName(): string {
        return 'PasswordUserLoginFailedEvent'
    }

    handle(event: PasswordUserLoginFailedEvent): void {
        console.warn(
            `[Subscriber] ログイン失敗: aggregateId=${event.aggregateId ?? 'unknown'}`
        )
    }
}
