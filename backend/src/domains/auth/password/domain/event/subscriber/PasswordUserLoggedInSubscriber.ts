// src/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { PasswordUserLoggedInEvent } from '../PasswordUserLoggedInEvent.js'

/**
 * PasswordUserLoggedInEvent を購読し、副作用（ログ出力など）を実行するSubscriber。
 */
export class PasswordUserLoggedInSubscriber
    implements DomainEventSubscriber<PasswordUserLoggedInEvent> {
    eventName(): string {
        return 'PasswordUserLoggedInEvent'
    }

    handle(event: PasswordUserLoggedInEvent): void {
        console.log(
            `[Subscriber] ユーザーがログインしました: aggregateId=${event.aggregateId}`
        )
    }
}
