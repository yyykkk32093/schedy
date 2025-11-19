// src/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { PasswordUserLoggedInEvent } from '../PasswordUserLoggedInEvent.js'

export class PasswordUserLoggedInSubscriber
    implements DomainEventSubscriber<PasswordUserLoggedInEvent> {
    subscribedTo(): string {
        return 'PasswordUserLoggedInEvent'
    }

    handle(event: PasswordUserLoggedInEvent): void {
        console.log(
            `[Subscriber] ユーザーがログインしました: aggregateId=${event.aggregateId}`
        )
    }
}
