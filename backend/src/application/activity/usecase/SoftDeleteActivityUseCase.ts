import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { Announcement } from '@/domains/announcement/domain/model/entity/Announcement.js'
import { AnnouncementContent } from '@/domains/announcement/domain/model/valueObject/AnnouncementContent.js'
import { AnnouncementId } from '@/domains/announcement/domain/model/valueObject/AnnouncementId.js'
import { AnnouncementTitle } from '@/domains/announcement/domain/model/valueObject/AnnouncementTitle.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { ActivityNotFoundError } from '../error/ActivityNotFoundError.js'
import { ActivityPermissionError } from '../error/ActivityPermissionError.js'

export type NotifyOption = 'announcement' | 'push_only' | 'none'

export type SoftDeleteActivityTxRepositories = {
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
    schedule: IScheduleRepository
    participation: IParticipationRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
    announcement: IAnnouncementRepository
}

export class SoftDeleteActivityUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<SoftDeleteActivityTxRepositories>,
        private readonly notificationService: NotificationService,
        private readonly idGenerator: IIdGenerator,
    ) { }

    async execute(input: {
        activityId: string
        userId: string
        notifyOption: NotifyOption
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const activity = await repos.activity.findById(input.activityId)
            if (!activity) throw new ActivityNotFoundError()

            const communityId = activity.getCommunityId().getValue()
            const activityTitle = activity.getTitle().getValue()

            // 権限チェック: OWNER / ADMIN のみ削除可
            const membership = await repos.membership.findByCommunityAndUser(
                communityId, input.userId,
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new ActivityPermissionError('アクティビティの削除はOWNERまたはADMINのみ実行できます')
            }

            // 論理削除
            activity.softDelete()
            await repos.activity.save(activity)

            // 通知なしの場合はここで終了
            if (input.notifyOption === 'none') return

            // ── 参加者一覧を収集（全スケジュールから重複排除） ──
            const schedules = await repos.schedule.findsByActivityId(input.activityId)
            const recipientUserIds = new Set<string>()
            for (const schedule of schedules) {
                const participations = await repos.participation.findsByScheduleId(schedule.getId().getValue())
                for (const p of participations) {
                    const uid = p.getUserId()?.getValue()
                    if (uid && uid !== input.userId) {
                        recipientUserIds.add(uid)
                    }
                }
            }

            if (recipientUserIds.size === 0) return

            // ── 「お知らせとして投稿する」の場合、Announcement を作成 ──
            if (input.notifyOption === 'announcement') {
                const announcementId = AnnouncementId.create(this.idGenerator.generate())
                const announcement = Announcement.create({
                    id: announcementId,
                    communityId: CommunityId.create(communityId),
                    authorId: UserId.create(input.userId),
                    title: AnnouncementTitle.create(`「${activityTitle}」が削除されました`),
                    content: AnnouncementContent.create(
                        `アクティビティ「${activityTitle}」は主催者により削除されました。`,
                    ),
                })
                await repos.announcement.save(announcement)
            }

            // ── 参加者にプッシュ通知を送信 ──
            for (const uid of recipientUserIds) {
                await this.notificationService.prepareNotification(repos, {
                    userId: uid,
                    type: 'ACTIVITY_CANCELLED',
                    title: 'アクティビティが削除されました',
                    body: `「${activityTitle}」が削除されました`,
                    referenceId: input.activityId,
                    referenceType: 'ACTIVITY',
                    metadata: {
                        communityId,
                        activityId: input.activityId,
                        activityTitle,
                    },
                })
            }
        })

        // TX commit 後にプッシュ通知を配信
        if (input.notifyOption !== 'none') {
            this.notificationService.flush()
        }
    }
}
