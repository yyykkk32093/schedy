// src/application/auth/event/AuthApplicationEventRegistry.ts

import { ApplicationEventBus } from '@/application/_sharedApplication/event/ApplicationEventBus.js'
import { AuthSecurityStateRepositoryImpl } from '@/domains/auth/security/infrastructure/repository/AuthSecurityStateRepositoryImpl.js'
import { UpdateAuthSecurityStateOnLoginFailedSubscriber } from './subscriber/UpdateAuthSecurityStateOnLoginFailedSubscriber.js'
import { UpdateAuthSecurityStateOnLoginSucceededSubscriber } from './subscriber/UpdateAuthSecurityStateOnLoginSucceededSubscriber.js'
import { UserLoginFailedSubscriber } from './subscriber/UserLoginFailedSubscriber.js'
import { UserLoginSucceededSubscriber } from './subscriber/UserLoginSucceededSubscriber.js'


/**
 * Auth の ApplicationEvent 購読者登録
 * - ログ出力
 */
export function registerAuthApplicationSubscribers(params: {
    appEventBus: ApplicationEventBus
}) {
    const { appEventBus } = params

    // ログなど（副作用）
    appEventBus.subscribe(new UserLoginSucceededSubscriber())
    appEventBus.subscribe(new UserLoginFailedSubscriber())

    // 軽い投影（ベストエフォート）
    appEventBus.subscribe(
        new UpdateAuthSecurityStateOnLoginSucceededSubscriber(
            new AuthSecurityStateRepositoryImpl()
        )
    )

    appEventBus.subscribe(
        new UpdateAuthSecurityStateOnLoginFailedSubscriber(
            new AuthSecurityStateRepositoryImpl()
        )
    )
}
