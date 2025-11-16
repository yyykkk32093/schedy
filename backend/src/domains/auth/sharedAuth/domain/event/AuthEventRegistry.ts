// domains/auth/sharedAuth/domain/event/AuthEventRegistry.ts
import { PasswordUserLoggedInSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoggedInSubscriber.js'
import { PasswordUserLoginFailedSubscriber } from '@/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.js'
import { OutboxRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js'
import { authDomainEventBus } from './AuthDomainEventBus.js'
import { PublishAuthIntegrationSubscriber } from './subscriber/PublishAuthIntegrationSubscriber.js'

export function registerAuthDomainSubscribers() {
    //
    // ① パスワード認証関連イベント（ドメインローカル処理）
    //
    authDomainEventBus.subscribe(new PasswordUserLoggedInSubscriber())
    authDomainEventBus.subscribe(new PasswordUserLoginFailedSubscriber())

    //
    // ② Outbox連携用Subscriber（IntegrationEvent変換）
    //
    const outboxRepo = new OutboxRepository()
    authDomainEventBus.subscribe(new PublishAuthIntegrationSubscriber(outboxRepo))
}
