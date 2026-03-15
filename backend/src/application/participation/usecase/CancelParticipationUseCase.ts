import { logger } from '@/_sharedTech/logger/logger.js'
import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationRepositoryImpl } from '@/application/_sharedApplication/notification/NotificationRepositoryImpl.js'
import type { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { ParticipationAuditLog } from '@/domains/activity/schedule/participation/domain/model/entity/ParticipationAuditLog.js'
import type { IParticipationAuditLogRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationAuditLogRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { calculatePaymentAmount } from '@/domains/activity/schedule/participation/domain/service/calculatePaymentAmount.js'
import { WaitlistAuditLog } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistAuditLog.js'
import type { IWaitlistAuditLogRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistAuditLogRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'
import type { IStripeService } from '@/integration/stripe/IStripeService.js'
import type { PrismaClient } from '@prisma/client'
import { ParticipationError } from '../error/ParticipationError.js'

export type CancelParticipationTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    participationAuditLog: IParticipationAuditLogRepository
    payment: IPaymentRepository
    waitlist: IWaitlistEntryRepository
    waitlistAuditLog: IWaitlistAuditLogRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

export class CancelParticipationUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CancelParticipationTxRepositories>,
        private readonly notificationService: NotificationService,
        private readonly prisma: PrismaClient,
        private readonly stripeService?: IStripeService,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<void> {
        let scheduleDate: Date | null = null
        let activityId: string | null = null
        let hasPaidPayment = false
        let stripeRefundInfo: { paymentIntentId: string; baseFee: number } | null = null

        await this.unitOfWork.run(async (repos) => {
            const participation = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (!participation) {
                throw new ParticipationError('参加表明が見つかりません', 'PARTICIPATION_NOT_FOUND')
            }

            // Payment テーブルから支払い情報を取得
            const payment = await repos.payment.findLatestByScheduleAndUser(
                input.scheduleId, input.userId
            )

            let paymentMethodSnapshot: string | null = null
            let paymentStatusSnapshot: string | null = null

            if (payment) {
                const ps = payment.getPaymentStatus()
                hasPaidPayment = ps.isReported() || ps.isConfirmed()
                paymentMethodSnapshot = payment.getPaymentMethod().getValue()
                paymentStatusSnapshot = ps.getValue()

                if (payment.isStripePaid()) {
                    const schedule = await repos.schedule.findById(input.scheduleId)
                    if (schedule) {
                        const baseFee = schedule.getParticipationFee()
                        if (baseFee) {
                            stripeRefundInfo = {
                                paymentIntentId: payment.getStripePaymentIntentId()!,
                                baseFee,
                            }
                        }
                    }
                    payment.markRefundPending()
                    await repos.payment.update(payment)
                } else if (ps.isConfirmed() || ps.isReported()) {
                    // CONFIRMED / REPORTED → REFUND_PENDING（幹事が返金管理で判断）
                    payment.markRefundPending()
                    await repos.payment.update(payment)
                }
            }

            await repos.participation.delete(input.scheduleId, input.userId)

            await repos.participationAuditLog.save(new ParticipationAuditLog({
                scheduleId: input.scheduleId,
                userId: input.userId,
                action: 'CANCELLED',
                cancelledAt: new Date(),
                paymentMethod: paymentMethodSnapshot,
                paymentStatus: paymentStatusSnapshot,
            }))

            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            scheduleDate = schedule.getDate()
            activityId = schedule.getActivityId().getValue()

            const attendingCount = await repos.participation.count(input.scheduleId)
            if (!schedule.isFull(attendingCount)) {
                const nextEntry = await repos.waitlist.findNext(input.scheduleId)
                if (nextEntry) {
                    const promotedUserId = nextEntry.getUserId().getValue()

                    await repos.waitlist.delete(input.scheduleId, promotedUserId)
                    await repos.waitlistAuditLog.save(new WaitlistAuditLog({
                        scheduleId: input.scheduleId,
                        userId: promotedUserId,
                        action: 'PROMOTED',
                    }))

                    const promotedParticipation = Participation.create({
                        id: this.idGenerator.generate(),
                        scheduleId: ScheduleId.create(input.scheduleId),
                        userId: nextEntry.getUserId(),
                    })
                    await repos.participation.add(promotedParticipation)
                    await repos.participationAuditLog.save(new ParticipationAuditLog({
                        scheduleId: input.scheduleId,
                        userId: promotedUserId,
                        action: 'JOINED',
                    }))

                    await this.notificationService.prepareNotification(repos, {
                        userId: promotedUserId,
                        type: 'WAITLIST_PROMOTED',
                        title: 'キャンセル待ちから繰り上がりました',
                        body: `スケジュールに参加確定しました`,
                        referenceId: input.scheduleId,
                        referenceType: 'SCHEDULE',
                    })
                }
            }
        })

        // TX commit 後の後処理
        if (scheduleDate && activityId) {
            await this.sendSameDayCancellationAlert(input.scheduleId, input.userId, scheduleDate, activityId)
        }

        if (hasPaidPayment && activityId) {
            await this.sendPaidCancellationAlert(input.scheduleId, input.userId, activityId)
        }

        // Stripe 自動返金
        if (stripeRefundInfo != null && this.stripeService) {
            const refundInfo = stripeRefundInfo as { paymentIntentId: string; baseFee: number }
            try {
                const { refundAmount } = calculatePaymentAmount(refundInfo.baseFee)
                await this.stripeService.refundPaymentIntent(
                    refundInfo.paymentIntentId,
                    refundAmount,
                )
                logger.info(
                    { paymentIntentId: refundInfo.paymentIntentId, refundAmount },
                    '[CancelParticipation] Stripe partial refund issued',
                )
            } catch (err) {
                logger.error(
                    { error: err, paymentIntentId: refundInfo.paymentIntentId },
                    '[CancelParticipation] Stripe refund failed',
                )
            }
        }

        this.notificationService.flush()
    }

    private async sendSameDayCancellationAlert(
        scheduleId: string,
        cancellerUserId: string,
        scheduleDate: Date,
        activityId: string,
    ): Promise<void> {
        try {
            const now = new Date()
            const isSameDay =
                scheduleDate.getFullYear() === now.getFullYear() &&
                scheduleDate.getMonth() === now.getMonth() &&
                scheduleDate.getDate() === now.getDate()
            if (!isSameDay) return

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
            console.error('[CancelParticipation] Failed to send same-day cancellation alert:', err)
        }
    }

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
