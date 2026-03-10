import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import type { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ActivityNotFoundError } from '@/application/activity/error/ActivityNotFoundError.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { SchedulePermissionError } from '@/application/schedule/error/SchedulePermissionError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type RemoveParticipantByAdminTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
    participation: IParticipationRepository
    waitlist: IWaitlistEntryRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

/**
 * 管理者による参加者除外 UseCase。
 * - OWNER / ADMIN のみ実行可能
 * - 対象参加者を CANCELLED にする
 * - WL 自動繰り上げ（Cancel と同ロジック）
 * - 除外されたユーザーに通知を送信
 */
export class RemoveParticipantByAdminUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<RemoveParticipantByAdminTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: {
        scheduleId: string
        targetUserId: string
        adminUserId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // スケジュール存在チェック
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            // アクティビティ → コミュニティ特定
            const activity = await repos.activity.findById(schedule.getActivityId().getValue())
            if (!activity) throw new ActivityNotFoundError()

            // 権限チェック: OWNER / ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                activity.getCommunityId().getValue(), input.adminUserId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new SchedulePermissionError('参加者の除外はOWNERまたはADMINのみ実行できます')
            }

            // 対象の Participation を取得
            const participation = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.targetUserId
            )
            if (!participation || !participation.isAttending()) {
                throw new ParticipationError('対象の参加者が見つかりません', 'PARTICIPATION_NOT_FOUND')
            }

            // キャンセル処理
            participation.cancel()
            await repos.participation.save(participation)

            // 自動繰り上げ: 定員に空きがあればキャンセル待ちの先頭を繰り上げ
            const attendingCount = await repos.participation.countAttending(input.scheduleId)
            if (!schedule.isFull(attendingCount)) {
                const nextEntry = await repos.waitlist.findNextWaiting(input.scheduleId)
                if (nextEntry) {
                    nextEntry.promote()
                    await repos.waitlist.save(nextEntry)

                    const promotedParticipation = Participation.create({
                        id: this.idGenerator.generate(),
                        scheduleId: ScheduleId.create(input.scheduleId),
                        userId: nextEntry.getUserId(),
                    })
                    await repos.participation.save(promotedParticipation)

                    // 繰り上げ通知
                    await this.notificationService.prepareNotification(repos, {
                        userId: nextEntry.getUserId().getValue(),
                        type: 'WAITLIST_PROMOTED',
                        title: 'キャンセル待ちから繰り上がりました',
                        body: `スケジュールに参加確定しました`,
                        referenceId: input.scheduleId,
                        referenceType: 'SCHEDULE',
                    })
                }
            }

            // 除外通知: 対象ユーザーに通知
            await this.notificationService.prepareNotification(repos, {
                userId: input.targetUserId,
                type: 'PARTICIPATION_REMOVED_BY_ADMIN',
                title: '参加が取り消されました',
                body: `${activity.getTitle().getValue()} のスケジュールから管理者により参加が取り消されました`,
                referenceId: input.scheduleId,
                referenceType: 'SCHEDULE',
            })
        })

        // TX commit 後に WS 配信
        this.notificationService.flush()
    }
}
