// src/application/auth/event/AuthApplicationEventRegistry.ts

import { ApplicationEventBus } from '@/application/_sharedApplication/event/ApplicationEventBus.js'
import type { IAuthSecurityStateRepository } from '@/domains/auth/security/domain/repository/IAuthSecurityStateRepository.js'
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
    authSecurityStateRepository: IAuthSecurityStateRepository
}) {
    const { appEventBus, authSecurityStateRepository } = params

    // ログなど（副作用）
    appEventBus.subscribe(new UserLoginSucceededSubscriber())
    appEventBus.subscribe(new UserLoginFailedSubscriber())

    // 軽い投影（ベストエフォート）
    appEventBus.subscribe(
        new UpdateAuthSecurityStateOnLoginSucceededSubscriber(authSecurityStateRepository)
    )

    appEventBus.subscribe(
        new UpdateAuthSecurityStateOnLoginFailedSubscriber(authSecurityStateRepository)
    )
}
