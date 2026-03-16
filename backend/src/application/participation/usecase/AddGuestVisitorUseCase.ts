import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { Payment } from '@/domains/activity/schedule/participation/domain/model/entity/Payment.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type AddGuestVisitorTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    payment: IPaymentRepository
}

/**
 * ゲストビジター（未登録ユーザー）をスケジュールに追加する
 * - 管理者やメンバーがアプリ未登録の参加者を代理登録
 * - userId は null、visitorName + addedBy で管理
 * - Payment レコードも同時に作成（paymentMethod=null, status=UNPAID）
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
    }): Promise<{ participationId: string }> {
        let participationId = ''

        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            if (schedule.isCancelled()) {
                throw new ParticipationError('キャンセルされたスケジュールにはビジターを追加できません', 'SCHEDULE_CANCELLED')
            }

            const attendingCount = await repos.participation.count(input.scheduleId)
            if (schedule.isFull(attendingCount)) {
                throw new ParticipationError('定員に達しています', 'SCHEDULE_FULL')
            }

            const id = this.idGenerator.generate()
            const participation = Participation.createGuestVisitor({
                id,
                scheduleId: ScheduleId.create(input.scheduleId),
                visitorName: input.visitorName,
                addedBy: input.addedBy,
            })
            await repos.participation.add(participation)

            // ビジター用 Payment レコード作成（paymentMethod=null → 管理者が後で設定）
            const fee = schedule.getVisitorFee() ?? schedule.getParticipationFee() ?? 0
            const payment = Payment.create({
                id: this.idGenerator.generate(),
                scheduleId: ScheduleId.create(input.scheduleId),
                participationId: id,
                amount: fee,
            })
            await repos.payment.add(payment)

            participationId = id
        })

        return { participationId }
    }
}
