// src/domains/auth/password/domain/event/subscriber/PasswordUserLoginFailedSubscriber.ts
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { logger } from '@/sharedTech/logger/logger.js'
import { PasswordUserLoginFailedEvent } from '../PasswordUserLoginFailedEvent.js'

/**
 * PasswordUserLoginFailedEvent を購読し、副作用（ログ出力など）を実行するSubscriber。
 */
export class PasswordUserLoginFailedSubscriber
    implements DomainEventSubscriber<PasswordUserLoginFailedEvent> {
    subscribedTo(): string {
        return 'PasswordUserLoginFailedEvent'
    }

    handle(event: PasswordUserLoginFailedEvent): void {

        logger.warn({ aggregateId: event.aggregateId }, "[PasswordUserLoginFailedSubscriber] ログイン失敗（パスワード認証）")


    }
}
