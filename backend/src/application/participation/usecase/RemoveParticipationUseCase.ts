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
import { ParticipationAuditLog } from '@/domains/activity/schedule/participation/domain/model/entity/ParticipationAuditLog.js'
import type { IParticipationAuditLogRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationAuditLogRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { WaitlistPromotedEvent } from '@/domains/activity/schedule/waitlist/domain/event/WaitlistPromotedEvent.js'
import { WaitlistAuditLog } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistAuditLog.js'
import type { IWaitlistAuditLogRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistAuditLogRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type RemoveParticipationTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    membership: ICommunityMembershipRepository
    participation: IParticipationRepository
    participationAuditLog: IParticipationAuditLogRepository
    payment: IPaymentRepository
    waitlist: IWaitlistEntryRepository
    waitlistAuditLog: IWaitlistAuditLogRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

/**
 * 参加者削除 UseCase（participationId ベース）。
 *
 * 権限ルール:
 * - ビジター（userId=null）: 追加者本人 OR 管理者以上（ADMIN/OWNER）
 * - MEMBER の参加: ADMIN 以上
 * - ADMIN の参加: OWNER のみ
 * - OWNER の参加: 削除不可
 */
export class RemoveParticipationUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<RemoveParticipationTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: {
        participationId: string
        requestUserId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos, txEventPublisher) => {
            // 対象の Participation を取得
            const participation = await repos.participation.findById(input.participationId)
            if (!participation) {
                throw new ParticipationError('対象の参加者が見つかりません', 'PARTICIPATION_NOT_FOUND')
            }

            const scheduleId = participation.getScheduleId().getValue()

            // スケジュール → アクティビティ → コミュニティ特定
            const schedule = await repos.schedule.findById(scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            const activity = await repos.activity.findById(schedule.getActivityId().getValue())
            if (!activity) throw new ActivityNotFoundError()

            const communityId = activity.getCommunityId().getValue()

            // リクエストユーザーのメンバーシップ取得
            const requestorMembership = await repos.membership.findByCommunityAndUser(
                communityId, input.requestUserId,
            )
            const requestorRole = requestorMembership?.isActive()
                ? requestorMembership.getRole().getValue()
                : null

            // 権限チェック
            const targetUserId = participation.getUserId()?.getValue() ?? null
            const isUnregisteredVisitor = targetUserId === null
            const addedBy = participation.getAddedBy()

            if (isUnregisteredVisitor) {
                // ビジター: 追加者本人 OR 管理者以上
                const isAdder = addedBy === input.requestUserId
                const isAdminOrAbove = requestorRole === 'OWNER' || requestorRole === 'ADMIN'
                if (!isAdder && !isAdminOrAbove) {
                    throw new SchedulePermissionError(
                        'ビジターの削除は追加者本人または管理者以上のみ実行できます',
                    )
                }
            } else {
                // メンバーの参加
                const targetMembership = await repos.membership.findByCommunityAndUser(
                    communityId, targetUserId,
                )
                const targetRole = targetMembership?.isActive()
                    ? targetMembership.getRole().getValue()
                    : 'MEMBER' // 退会済みはMEMBER相当

                if (targetRole === 'OWNER') {
                    throw new SchedulePermissionError('OWNERの参加は削除できません')
                }
                if (targetRole === 'ADMIN') {
                    if (requestorRole !== 'OWNER') {
                        throw new SchedulePermissionError('ADMINの参加はOWNERのみ削除できます')
                    }
                } else {
                    // MEMBER
                    if (requestorRole !== 'OWNER' && requestorRole !== 'ADMIN') {
                        throw new SchedulePermissionError('メンバーの参加は管理者以上のみ削除できます')
                    }
                }
            }

            // Payment スナップショット取得（ビジターは participationId 経由）
            let paymentMethodSnapshot: string | null = null
            let paymentStatusSnapshot: string | null = null
            let payment
            if (targetUserId) {
                payment = await repos.payment.findLatestByScheduleAndUser(scheduleId, targetUserId)
            } else {
                // 未登録ビジター: participationId で検索
                payment = await repos.payment.findByParticipationId(input.participationId)
            }
            if (payment) {
                paymentMethodSnapshot = payment.getPaymentMethod()?.getValue() ?? null
                paymentStatusSnapshot = payment.getPaymentStatus().getValue() ?? null
                // 支払済みの場合は返金待ちに遷移
                const ps = payment.getPaymentStatus()
                if (ps.isConfirmed() || ps.isReported()) {
                    payment.markRefundPending()
                    await repos.payment.update(payment)
                }
            }

            // 物理削除
            await repos.participation.deleteById(input.participationId)

            // AuditLog: REMOVED_BY_ADMIN
            await repos.participationAuditLog.save(new ParticipationAuditLog({
                scheduleId,
                userId: targetUserId ?? `guest:${input.participationId}`,
                action: 'REMOVED_BY_ADMIN',
                cancelledAt: new Date(),
                paymentMethod: paymentMethodSnapshot,
                paymentStatus: paymentStatusSnapshot,
            }))

            // 自動繰り上げ
            const attendingCount = await repos.participation.count(scheduleId)
            if (!schedule.isFull(attendingCount)) {
                const nextEntry = await repos.waitlist.findNext(scheduleId)
                if (nextEntry) {
                    const promotedUserId = nextEntry.getUserId()?.getValue() ?? `guest:${nextEntry.getId()}`

                    await repos.waitlist.deleteById(nextEntry.getId())
                    await repos.waitlistAuditLog.save(new WaitlistAuditLog({
                        scheduleId,
                        userId: promotedUserId,
                        action: 'PROMOTED',
                    }))

                    // ビジター判定: 未登録ビジターなら createUnregisteredVisitor を使用
                    let promotedParticipation: Participation
                    if (nextEntry.getIsVisitor() && !nextEntry.getUserId()) {
                        promotedParticipation = Participation.createUnregisteredVisitor({
                            id: this.idGenerator.generate(),
                            scheduleId: ScheduleId.create(scheduleId),
                            visitorName: nextEntry.getVisitorName()!,
                            addedBy: nextEntry.getAddedBy()!,
                        })
                    } else {
                        promotedParticipation = Participation.create({
                            id: this.idGenerator.generate(),
                            scheduleId: ScheduleId.create(scheduleId),
                            userId: nextEntry.getUserId()!,
                            isVisitor: nextEntry.getIsVisitor(),
                        })
                    }
                    await repos.participation.add(promotedParticipation)
                    await repos.participationAuditLog.save(new ParticipationAuditLog({
                        scheduleId,
                        userId: promotedUserId,
                        action: 'JOINED',
                    }))

                    await txEventPublisher?.publishAll([
                        new WaitlistPromotedEvent(scheduleId, promotedUserId, promotedParticipation.getId(), nextEntry.getIsVisitor(), nextEntry.getVisitorName() ?? null),
                    ])

                    await this.notificationService.prepareNotification(repos, {
                        userId: promotedUserId,
                        type: 'WAITLIST_PROMOTED',
                        title: 'キャンセル待ちから繰り上がりました',
                        body: 'スケジュールに参加確定しました',
                        referenceId: scheduleId,
                        referenceType: 'SCHEDULE',
                        metadata: {
                            communityId,
                            activityId: activity.getId(),
                            activityTitle: activity.getTitle().getValue(),
                            scheduleDate: schedule.getDate()?.toISOString() ?? undefined,
                        },
                    })
                }
            }

            // 除外通知（メンバーの場合のみ — ビジターは通知先がない）
            if (targetUserId) {
                await this.notificationService.prepareNotification(repos, {
                    userId: targetUserId,
                    type: 'PARTICIPATION_REMOVED_BY_ADMIN',
                    title: '参加が取り消されました',
                    body: `${activity.getTitle().getValue()} のスケジュールから参加が取り消されました`,
                    referenceId: scheduleId,
                    referenceType: 'SCHEDULE',
                    metadata: {
                        communityId,
                        activityId: activity.getId(),
                        activityTitle: activity.getTitle().getValue(),
                        scheduleDate: schedule.getDate()?.toISOString() ?? undefined,
                    },
                })
            }
        })

        this.notificationService.flush()
    }
}
