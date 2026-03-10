import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationRepositoryImpl } from '@/application/_sharedApplication/notification/NotificationRepositoryImpl.js'
import type { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'
import type { PrismaClient } from '@prisma/client'
import { ParticipationError } from '../error/ParticipationError.js'

export type CancelParticipationTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    waitlist: IWaitlistEntryRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

/**
 * 参加キャンセル UseCase。
 * - 参加をキャンセル
 * - 同一トランザクション内でキャンセル待ち繰り上げを実行
 *   1. WaitlistEntry (position=1, status=WAITING) を取得
 *   2. → Participation 作成 (ATTENDING) + WaitlistEntry.status = PROMOTED
 * - 繰り上げ時に WAITLIST_PROMOTED 通知を生成（① DB + ② Outbox → ③ WS）
 */
export class CancelParticipationUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CancelParticipationTxRepositories>,
        private readonly notificationService: NotificationService,
        private readonly prisma: PrismaClient,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<void> {
        let scheduleDate: Date | null = null
        let activityId: string | null = null
        let hasPaidPayment = false

        await this.unitOfWork.run(async (repos) => {
            const participation = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (!participation || !participation.isAttending()) {
                throw new ParticipationError('参加表明が見つかりません', 'PARTICIPATION_NOT_FOUND')
            }

            // 有料参加かどうかを TX 内で記録（REPORTED / CONFIRMED → 返金アラート対象）
            const ps = participation.getPaymentStatus()
            hasPaidPayment = ps != null && (ps.isReported() || ps.isConfirmed())

            // キャンセル
            participation.cancel()
            await repos.participation.save(participation)

            // 自動繰り上げ: 定員に空きがあればキャンセル待ちの先頭を繰り上げ
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            scheduleDate = schedule.getDate()
            activityId = schedule.getActivityId().getValue()

            const attendingCount = await repos.participation.countAttending(input.scheduleId)
            if (!schedule.isFull(attendingCount)) {
                const nextEntry = await repos.waitlist.findNextWaiting(input.scheduleId)
                if (nextEntry) {
                    // 繰り上げ: WaitlistEntry → PROMOTED + Participation 作成（or 再参加）
                    nextEntry.promote()
                    await repos.waitlist.save(nextEntry)

                    // 既存の CANCELLED Participation があれば reattend（@@unique 制約回避）
                    const existingParticipation = await repos.participation.findByScheduleAndUser(
                        input.scheduleId, nextEntry.getUserId().getValue()
                    )
                    if (existingParticipation && !existingParticipation.isAttending()) {
                        existingParticipation.reattend()
                        await repos.participation.save(existingParticipation)
                    } else {
                        const promotedParticipation = Participation.create({
                            id: this.idGenerator.generate(),
                            scheduleId: ScheduleId.create(input.scheduleId),
                            userId: nextEntry.getUserId(),
                        })
                        await repos.participation.save(promotedParticipation)
                    }

                    // 通知: ① Notification INSERT + ② OutboxEvent INSERT（同一 TX 内）
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
        })

        // TX commit 後: 当日キャンセルなら管理者にアラート（UBL-18-3）
        if (scheduleDate && activityId) {
            await this.sendSameDayCancellationAlert(input.scheduleId, input.userId, scheduleDate, activityId)
        }

        // TX commit 後: 有料参加者のキャンセル → 管理者に返金アラート
        if (hasPaidPayment && activityId) {
            await this.sendPaidCancellationAlert(input.scheduleId, input.userId, activityId)
        }

        // ③ TX commit 後に WS 配信（fire-and-forget）
        this.notificationService.flush()
    }

    /**
     * 当日キャンセル時に OWNER/ADMIN へプッシュ通知を送信する。
     * メイン TX の外で実行し、失敗しても参加キャンセル自体はロールバックしない。
     */
    private async sendSameDayCancellationAlert(
        scheduleId: string,
        cancellerUserId: string,
        scheduleDate: Date,
        activityId: string,
    ): Promise<void> {
        try {
            // 当日判定
            const now = new Date()
            const isSameDay =
                scheduleDate.getFullYear() === now.getFullYear() &&
                scheduleDate.getMonth() === now.getMonth() &&
                scheduleDate.getDate() === now.getDate()
            if (!isSameDay) return

            // コミュニティ設定チェック
            const activity = await this.prisma.activity.findUnique({
                where: { id: activityId },
                select: { communityId: true, title: true },
            })
            if (!activity) return

            const community = await this.prisma.community.findUnique({
                where: { id: activity.communityId },
                select: { cancellationAlertEnabled: true },
            })
            if (!community?.cancellationAlertEnabled) return

            // OWNER/ADMIN を取得（キャンセルした本人は除外）
            const admins = await this.prisma.communityMembership.findMany({
                where: {
                    communityId: activity.communityId,
                    role: { in: ['OWNER', 'ADMIN'] },
                    leftAt: null,
                    userId: { not: cancellerUserId },
                },
                select: { userId: true },
            })
            if (admins.length === 0) return

            // キャンセルしたユーザー名を取得
            const canceller = await this.prisma.user.findUnique({
                where: { id: cancellerUserId },
                select: { displayName: true },
            })
            const cancellerName = canceller?.displayName ?? '不明なユーザー'

            // 別 TX で通知を生成（メイン TX とは独立）
            await this.prisma.$transaction(async (tx) => {
                const notifRepo = new NotificationRepositoryImpl(tx)
                const outboxRepo = new OutboxRepository(tx)
                for (const admin of admins) {
                    await this.notificationService.prepareNotification(
                        { notification: notifRepo, outbox: outboxRepo },
                        {
                            userId: admin.userId,
                            type: 'SAME_DAY_CANCELLATION',
                            title: '当日キャンセルが発生しました',
                            body: `${cancellerName}さんが${activity.title}の本日のスケジュールをキャンセルしました`,
                            referenceId: scheduleId,
                            referenceType: 'SCHEDULE',
                        },
                    )
                }
            })
        } catch (err) {
            // アラート送信失敗は握りつぶす（キャンセル自体は成功済み）
            // ログは出す
            console.error('[CancelParticipation] Failed to send same-day cancellation alert:', err)
        }
    }

    /**
     * 有料参加者がキャンセルした際に OWNER/ADMIN へ返金アラートを送信する。
     * メイン TX の外で実行し、失敗しても参加キャンセル自体はロールバックしない。
     */
    private async sendPaidCancellationAlert(
        scheduleId: string,
        cancellerUserId: string,
        activityId: string,
    ): Promise<void> {
        try {
            const activity = await this.prisma.activity.findUnique({
                where: { id: activityId },
                select: { communityId: true, title: true },
            })
            if (!activity) return

            // OWNER/ADMIN を取得（キャンセルした本人は除外）
            const admins = await this.prisma.communityMembership.findMany({
                where: {
                    communityId: activity.communityId,
                    role: { in: ['OWNER', 'ADMIN'] },
                    leftAt: null,
                    userId: { not: cancellerUserId },
                },
                select: { userId: true },
            })
            if (admins.length === 0) return

            const canceller = await this.prisma.user.findUnique({
                where: { id: cancellerUserId },
                select: { displayName: true },
            })
            const cancellerName = canceller?.displayName ?? '不明なユーザー'

            await this.prisma.$transaction(async (tx) => {
                const notifRepo = new NotificationRepositoryImpl(tx)
                const outboxRepo = new OutboxRepository(tx)
                for (const admin of admins) {
                    await this.notificationService.prepareNotification(
                        { notification: notifRepo, outbox: outboxRepo },
                        {
                            userId: admin.userId,
                            type: 'PAID_CANCELLATION',
                            title: '支払済み参加者がキャンセルしました',
                            body: `${cancellerName}さんが${activity.title}のスケジュールをキャンセルしました。返金対応をご確認ください。`,
                            referenceId: scheduleId,
                            referenceType: 'SCHEDULE',
                        },
                    )
                }
            })
        } catch (err) {
            console.error('[CancelParticipation] Failed to send paid cancellation alert:', err)
        }
    }
}
