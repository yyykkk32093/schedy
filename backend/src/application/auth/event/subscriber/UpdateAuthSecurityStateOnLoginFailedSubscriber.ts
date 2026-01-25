import { logger } from '@/_sharedTech/logger/logger.js'
import { ApplicationEventSubscriber } from '@/application/_sharedApplication/event/ApplicationEventSubscriber.js'
import type { UserLoginFailedEvent } from '@/application/auth/event/UserLoginFailedEvent.js'

import type { IAuthSecurityStateRepository } from '@/domains/auth/security/domain/repository/IAuthSecurityStateRepository.js'

/**
 * commit後Subscriber（ベストエフォート）
 * - auth_security_states を「失敗回数 / ロック」で投影更新する
 * - userId が特定できない失敗（USER_NOT_FOUND 等）は更新できないためスキップ
 */
export class UpdateAuthSecurityStateOnLoginFailedSubscriber
    implements ApplicationEventSubscriber<UserLoginFailedEvent> {

    private static readonly DEFAULT_MAX_FAILURES = 5
    private static readonly DEFAULT_LOCK_DURATION_MS = 15 * 60 * 1000

    constructor(private readonly repo: IAuthSecurityStateRepository) { }

    subscribedTo() {
        return 'UserLoginFailedEvent'
    }

    async handle(event: UserLoginFailedEvent) {
        if (!event.userId) {
            return
        }

        const maxFailures = this.parsePositiveInt(
            process.env.AUTH_MAX_FAILED_SIGNIN_COUNT,
            UpdateAuthSecurityStateOnLoginFailedSubscriber.DEFAULT_MAX_FAILURES
        )

        const lockDurationMs = this.resolveLockDurationMs()

        try {
            await this.repo.recordLoginFailure({
                userId: event.userId.getValue(),
                occurredAt: event.occurredAt,
                maxFailures,
                lockDurationMs,
            })
        } catch (err) {
            // best-effort: 認証失敗自体の処理を壊さない
            logger.warn(
                { error: err, userId: event.userId.getValue() },
                '[Auth] failed to update auth_security_states on login failed'
            )
        }
    }

    private resolveLockDurationMs(): number {
        const ms = this.parsePositiveInt(
            process.env.AUTH_LOCK_DURATION_MS,
            0
        )

        if (ms > 0) {
            return ms
        }

        const minutes = this.parsePositiveInt(
            process.env.AUTH_LOCK_DURATION_MINUTES,
            UpdateAuthSecurityStateOnLoginFailedSubscriber.DEFAULT_LOCK_DURATION_MS / 60_000
        )

        return minutes * 60_000
    }

    private parsePositiveInt(value: string | undefined, fallback: number): number {
        if (!value) {
            return fallback
        }

        const parsed = Number(value)
        if (!Number.isFinite(parsed)) {
            return fallback
        }

        const asInt = Math.trunc(parsed)
        return asInt > 0 ? asInt : fallback
    }
}
