import type { TransactionalDomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventSubscriber.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { MemberLeftEvent } from '@/domains/community/membership/domain/event/MemberLeftEvent.js'

/**
 * CancelFutureParticipationsOnMemberLeft
 *
 * コミュニティ退出時に、そのコミュニティ配下の将来スケジュールへの
 * 参加(Participation)を物理削除し、支払済みの場合はREFUND_PENDINGに更新。
 */
export class CancelFutureParticipationsOnMemberLeft
    implements TransactionalDomainEventSubscriber<MemberLeftEvent> {

    subscribedTo(): string {
        return MemberLeftEvent.EVENT_NAME
    }

    async handle(
        event: MemberLeftEvent,
        repos: {
            schedule: IScheduleRepository
            participation: IParticipationRepository
            payment: IPaymentRepository
        },
    ): Promise<void> {
        // コミュニティ配下の将来スケジュールを取得
        const schedules = await repos.schedule.findFutureByCommunityId(event.communityId)

        for (const schedule of schedules) {
            const scheduleId = schedule.getId().getValue()
            const participation = await repos.participation.findByScheduleAndUser(
                scheduleId, event.userId,
            )
            if (!participation) continue

            // 支払い済みの場合、REFUND_PENDING にする
            const payment = await repos.payment.findLatestByScheduleAndUser(
                scheduleId, event.userId,
            )
            if (payment) {
                const ps = payment.getPaymentStatus()
                if (ps.isReported() || ps.isConfirmed()) {
                    payment.markRefundPending()
                    await repos.payment.update(payment)
                }
            }

            // Participation を物理削除
            await repos.participation.delete(scheduleId, event.userId)
        }
    }
}
