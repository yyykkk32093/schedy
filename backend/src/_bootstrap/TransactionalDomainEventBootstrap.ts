// src/_bootstrap/TransactionalDomainEventBootstrap.ts

import { TransactionalDomainEventBus } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventBus.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { CreatePaymentOnWaitlistPromoted } from '@/domains/activity/schedule/waitlist/domain/subscriber/CreatePaymentOnWaitlistPromoted.js'
import { CancelFutureParticipationsOnMemberLeft } from '@/domains/community/membership/domain/subscriber/CancelFutureParticipationsOnMemberLeft.js'
import { RemoveDmParticipantsOnMemberLeft } from '@/domains/community/membership/domain/subscriber/RemoveDmParticipantsOnMemberLeft.js'
import { RemoveWaitlistEntriesOnMemberLeft } from '@/domains/community/membership/domain/subscriber/RemoveWaitlistEntriesOnMemberLeft.js'

/**
 * TransactionalDomainEventBootstrap
 *
 * TX 内ドメインイベントバスの singleton 管理。
 * 起動時に bootstrap() で初期化し、各コンテキストの Registrar で Subscriber を登録する。
 *
 * PrismaUnitOfWork にこの Bus を渡すことで、
 * UoW.run() 内の txEventPublisher から TX 内イベント配信が可能になる。
 *
 * 【DomainEventBootstrap との関係】
 * - DomainEventBootstrap            : TX commit 後のベストエフォート副作用
 * - TransactionalDomainEventBootstrap: TX 内のアトミック副作用
 */
export class TransactionalDomainEventBootstrap {
    private static txEventBus: TransactionalDomainEventBus | null = null

    static bootstrap(): void {
        if (this.txEventBus) return

        const bus = new TransactionalDomainEventBus()

        // --- MemberLeftEvent Subscribers ---
        bus.subscribe(new CancelFutureParticipationsOnMemberLeft())
        bus.subscribe(new RemoveWaitlistEntriesOnMemberLeft())
        bus.subscribe(new RemoveDmParticipantsOnMemberLeft())

        // --- WaitlistPromotedEvent Subscribers ---
        bus.subscribe(new CreatePaymentOnWaitlistPromoted(new UuidGenerator()))

        this.txEventBus = bus
    }

    static getEventBus(): TransactionalDomainEventBus {
        if (!this.txEventBus) {
            throw new Error(
                'TransactionalDomainEventBus is not initialized. Call TransactionalDomainEventBootstrap.bootstrap() first.'
            )
        }
        return this.txEventBus
    }
}
