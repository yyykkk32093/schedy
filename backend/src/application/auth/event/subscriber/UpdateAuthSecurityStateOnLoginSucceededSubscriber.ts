import { logger } from '@/_sharedTech/logger/logger.js'
import { ApplicationEventSubscriber } from '@/application/_sharedApplication/event/ApplicationEventSubscriber.js'
import type { UserLoginSucceededEvent } from '@/application/auth/event/UserLoginSucceededEvent.js'

import type { IAuthSecurityStateRepository } from '@/domains/auth/security/domain/repository/IAuthSecurityStateRepository.js'

/**
 * commit後Subscriber（ベストエフォート）
 * - auth_security_states を「最後に成功した方式/時刻」で投影更新する
 */
export class UpdateAuthSecurityStateOnLoginSucceededSubscriber
    implements ApplicationEventSubscriber<UserLoginSucceededEvent> {

    constructor(private readonly repo: IAuthSecurityStateRepository) { }

    subscribedTo() {
        return 'UserLoginSucceededEvent'
    }

    async handle(event: UserLoginSucceededEvent) {
        try {
            await this.repo.recordLoginSuccess({
                userId: event.userId.getValue(),
                authMethod: event.method,
                occurredAt: event.occurredAt,
            })
        } catch (err) {
            // best-effort: ログイン成功自体は失敗させない
            logger.warn(
                { error: err, userId: event.userId.getValue() },
                '[Auth] failed to update auth_security_states (best-effort)'
            )
        }
    }
}
