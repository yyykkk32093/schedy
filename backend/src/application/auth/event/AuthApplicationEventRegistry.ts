// src/application/auth/event/AuthApplicationEventRegistry.ts

import { ApplicationEventBus } from '@/application/_sharedApplication/event/ApplicationEventBus.js'
import { AuthIntegrationOutboxSubscriber } from '@/integration/auth/event/subscriber/AuthIntegrationOutboxSubscriber.js'
import { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { UserLoginFailedSubscriber } from './subscriber/UserLoginFailedSubscriber.js'
import { UserLoginSucceededSubscriber } from './subscriber/UserLoginSucceededSubscriber.js'


/**
 * Auth の ApplicationEvent 購読者登録
 * - ログ出力
 * - Outbox連携（IntegrationEvent化して保存）
 */
export function registerAuthApplicationSubscribers(params: {
    appEventBus: ApplicationEventBus
    outboxRepository: IOutboxRepository
}) {
    const { appEventBus, outboxRepository } = params

    // ログなど（副作用）
    appEventBus.subscribe(new UserLoginSucceededSubscriber())
    appEventBus.subscribe(new UserLoginFailedSubscriber())

    // Outbox連携（成功だけ飛ばす等のポリシーは Subscriber 側に閉じる）
    appEventBus.subscribe(new AuthIntegrationOutboxSubscriber(outboxRepository))
}
