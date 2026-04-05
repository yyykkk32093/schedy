import type { TransactionalDomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventSubscriber.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Payment } from '@/domains/activity/schedule/participation/domain/model/entity/Payment.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { WaitlistPromotedEvent } from '../event/WaitlistPromotedEvent.js'

/**
 * CreatePaymentOnWaitlistPromoted
 *
 * D-P2-7: キャンセル待ちから繰り上がった際に、
 * スケジュールの参加費を基に Payment レコード（UNPAID）を自動作成する。
 *
 * isVisitor の場合は visitorFee ?? participationFee を使用する（D-5:A fallback パターン）。
 */
export class CreatePaymentOnWaitlistPromoted
    implements TransactionalDomainEventSubscriber<WaitlistPromotedEvent> {

    constructor(
        private readonly idGenerator: IIdGenerator,
    ) { }

    subscribedTo(): string {
        return WaitlistPromotedEvent.EVENT_NAME
    }

    async handle(
        event: WaitlistPromotedEvent,
        repos: {
            schedule: IScheduleRepository
            payment: IPaymentRepository
        },
    ): Promise<void> {
        const schedule = await repos.schedule.findById(event.scheduleId)
        if (!schedule) return

        // D-5:A: ビジターの場合は visitorFee ?? participationFee のフォールバック
        const baseFee = event.isVisitor
            ? (schedule.getVisitorFee() ?? schedule.getParticipationFee())
            : schedule.getParticipationFee()
        if (!baseFee || baseFee <= 0) return // 無料スケジュールは Payment 不要

        const payment = Payment.create({
            id: this.idGenerator.generate(),
            scheduleId: schedule.getId(),
            participationId: event.participationId,
            userId: event.promotedUserId.startsWith('guest:') ? undefined : UserId.create(event.promotedUserId),
            displayName: event.displayName,
            amount: baseFee,
        })

        await repos.payment.add(payment)
    }
}
