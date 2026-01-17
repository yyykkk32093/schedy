import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { registerAuthDomainSubscribers } from '@/domains/auth/_sharedAuth/domain/event/AuthDomainSubscribersRegistrar.js'
import { registerUserDomainSubscribers } from '@/domains/user/domain/event/UserDomainSubscribersRegistrar.js'

/**
 * DomainEventBootstrap
 *
 * - DomainEventBus は singleton とする
 * - 登録（subscribe）は明示的に bootstrap 関数経由で行う
 * - commit後flush（publish-only）は UseCase 側の責務
 */
export class DomainEventBootstrap {
    private static domainEventBus: DomainEventBus | null = null

    static bootstrap(): void {
        if (this.domainEventBus) return

        const bus = new DomainEventBus()

        registerUserDomainSubscribers(bus)
        registerAuthDomainSubscribers(bus)

        this.domainEventBus = bus
    }

    static getEventBus(): DomainEventBus {
        if (!this.domainEventBus) {
            throw new Error(
                'DomainEventBus is not initialized. Call DomainEventBootstrap.bootstrap() first.'
            )
        }
        return this.domainEventBus
    }
}
