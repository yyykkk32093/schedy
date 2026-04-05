import type { TransactionalDomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventSubscriber.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { MemberLeftEvent } from '@/domains/community/membership/domain/event/MemberLeftEvent.js'

/**
 * RemoveWaitlistEntriesOnMemberLeft
 *
 * コミュニティ退出時に、そのコミュニティ配下の将来スケジュールの
 * キャンセル待ち(WaitlistEntry)を物理削除。
 */
export class RemoveWaitlistEntriesOnMemberLeft
    implements TransactionalDomainEventSubscriber<MemberLeftEvent> {

    subscribedTo(): string {
        return MemberLeftEvent.EVENT_NAME
    }

    async handle(
        event: MemberLeftEvent,
        repos: {
            schedule: IScheduleRepository
            waitlist: IWaitlistEntryRepository
        },
    ): Promise<void> {
        const schedules = await repos.schedule.findFutureByCommunityId(event.communityId)

        for (const schedule of schedules) {
            const scheduleId = schedule.getId().getValue()
            const entry = await repos.waitlist.findByScheduleAndUser(scheduleId, event.userId)
            if (entry) {
                await repos.waitlist.delete(scheduleId, event.userId)
            }
        }
    }
}
