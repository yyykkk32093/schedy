import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { Payment } from '@/domains/activity/schedule/participation/domain/model/entity/Payment.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { WaitlistAuditLog } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistAuditLog.js'
import { WaitlistEntry } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistEntry.js'
import type { IWaitlistAuditLogRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistAuditLogRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type AddGuestVisitorTxRepositories = {
    schedule: IScheduleRepository
    activity: IActivityRepository
    participation: IParticipationRepository
    payment: IPaymentRepository
    waitlist: IWaitlistEntryRepository
    waitlistAuditLog: IWaitlistAuditLogRepository
}

/**
 * 未登録ビジターをスケジュールに追加する
 * - 管理者やメンバーがアプリ未登録の参加者を代理登録
 * - userId は null、visitorName + addedBy で管理
 * - Payment レコードも同時に作成（paymentMethod=null, status=UNPAID）
 * - 定員超過時、allowVisitorWaitlist=true ならキャンセル待ちに追加
 */
export class AddGuestVisitorUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<AddGuestVisitorTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        visitorName: string
        addedBy: string   // 追加者の userId
    }): Promise<{ participationId: string; waitlisted: boolean }> {
        let participationId = ''
        let waitlisted = false

        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            if (schedule.isCancelled()) {
                throw new ParticipationError('キャンセルされたスケジュールにはビジターを追加できません', 'SCHEDULE_CANCELLED')
            }

            const attendingCount = await repos.participation.count(input.scheduleId)
            if (schedule.isFull(attendingCount)) {
                // 定員超過: allowVisitorWaitlist を確認
                const activity = await repos.activity.findById(schedule.getActivityId().getValue())
                if (!activity || !activity.getAllowVisitorWaitlist()) {
                    throw new ParticipationError('定員に達しています', 'SCHEDULE_FULL')
                }

                // キャンセル待ちに追加（ゲストビジター: userId=null）
                const entryId = this.idGenerator.generate()
                const entry = WaitlistEntry.create({
                    id: entryId,
                    scheduleId: ScheduleId.create(input.scheduleId),
                    userId: null,
                    isVisitor: true,
                    visitorName: input.visitorName,
                    addedBy: input.addedBy,
                })
                await repos.waitlist.add(entry)

                await repos.waitlistAuditLog.save(new WaitlistAuditLog({
                    scheduleId: input.scheduleId,
                    userId: input.addedBy,
                    action: 'JOINED',
                }))

                participationId = entryId
                waitlisted = true
                return
            }

            const id = this.idGenerator.generate()
            const participation = Participation.createUnregisteredVisitor({
                id,
                scheduleId: ScheduleId.create(input.scheduleId),
                visitorName: input.visitorName,
                addedBy: input.addedBy,
            })
            await repos.participation.add(participation)

            // ビジター用 Payment レコード作成（paymentMethod=null → 管理者が後で設定）
            const fee = (schedule.getVisitorFee() ?? schedule.getParticipationFee()).amount
            const payment = Payment.create({
                id: this.idGenerator.generate(),
                scheduleId: ScheduleId.create(input.scheduleId),
                participationId: id,
                displayName: input.visitorName,
                amount: fee,
            })
            await repos.payment.add(payment)

            participationId = id
        })

        return { participationId, waitlisted }
    }
}
