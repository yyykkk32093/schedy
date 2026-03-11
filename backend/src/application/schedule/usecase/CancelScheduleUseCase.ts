import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import type { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ActivityNotFoundError } from '@/application/activity/error/ActivityNotFoundError.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { ScheduleNotFoundError } from '../error/ScheduleNotFoundError.js'
import { SchedulePermissionError } from '../error/SchedulePermissionError.js'

export type CancelScheduleTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
    participation: IParticipationRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

export class CancelScheduleUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<CancelScheduleTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            const activity = await repos.activity.findById(schedule.getActivityId().getValue())
            if (!activity) throw new ActivityNotFoundError()

            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new SchedulePermissionError('スケジュールのキャンセルはOWNERまたはADMINのみ実行できます')
            }

            schedule.cancel()
            await repos.schedule.save(schedule)

            // 通知: 全参加者に SCHEDULE_CANCELLED 通知
            const participations = await repos.participation.findsByScheduleId(input.scheduleId)
            for (const p of participations) {
                if (p.getUserId().getValue() === input.userId) continue // キャンセル実行者自身は除外

                await this.notificationService.prepareNotification(repos, {
                    userId: p.getUserId().getValue(),
                    type: 'SCHEDULE_CANCELLED',
                    title: 'スケジュールが取り消されました',
                    body: `${activity.getTitle()} のスケジュールが取り消されました`,
                    referenceId: input.scheduleId,
                    referenceType: 'SCHEDULE',
                })
            }
        })

        // TX commit 後に WS 配信
        this.notificationService.flush()
    }
}
