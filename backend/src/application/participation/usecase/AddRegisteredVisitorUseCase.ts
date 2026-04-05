import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { Payment } from '@/domains/activity/schedule/participation/domain/model/entity/Payment.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type AddRegisteredVisitorTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    payment: IPaymentRepository
}

/**
 * W3-13a: 登録済みビジター追加 UseCase
 *
 * 管理者やメンバーが、アプリ登録済みユーザーをビジターとしてスケジュールに代理追加する。
 * - Participation.create に isVisitor: true を渡す
 * - userId があるので重複チェックを行う
 * - 料金は visitorFee ?? participationFee ?? 0 (D-5:A fallback パターン)
 * - fee > 0 なら Payment レコード (UNPAID) を自動作成
 */
export class AddRegisteredVisitorUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<AddRegisteredVisitorTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        visitorUserId: string
        addedBy: string
        displayName?: string | null
    }): Promise<{ participationId: string }> {
        let participationId = ''

        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            if (schedule.isCancelled()) {
                throw new ParticipationError('キャンセルされたスケジュールには参加できません', 'SCHEDULE_CANCELLED')
            }

            // 定員チェック
            const attendingCount = await repos.participation.count(input.scheduleId)
            if (schedule.isFull(attendingCount)) {
                throw new ParticipationError('定員に達しています', 'SCHEDULE_FULL')
            }

            // 重複チェック（登録済みユーザーなので userId で判定可能）
            const existingParticipation = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.visitorUserId
            )
            if (existingParticipation) {
                throw new ParticipationError('すでに参加登録されています', 'ALREADY_ATTENDING')
            }

            // Participation 作成: isVisitor = true
            const id = this.idGenerator.generate()
            const participation = Participation.create({
                id,
                scheduleId: ScheduleId.create(input.scheduleId),
                userId: UserId.create(input.visitorUserId),
                isVisitor: true,
            })
            await repos.participation.add(participation)

            // D-5:A: visitorFee ?? participationFee ?? 0
            const fee = schedule.getVisitorFee() ?? schedule.getParticipationFee() ?? 0
            if (fee > 0) {
                const payment = Payment.create({
                    id: this.idGenerator.generate(),
                    scheduleId: schedule.getId(),
                    participationId: id,
                    userId: UserId.create(input.visitorUserId),
                    displayName: input.displayName ?? null,
                    amount: fee,
                })
                await repos.payment.add(payment)
            }

            participationId = id
        })

        return { participationId }
    }
}
