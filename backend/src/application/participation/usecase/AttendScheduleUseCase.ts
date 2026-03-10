import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { PaymentMethod } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentMethod.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type AttendScheduleTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
}

/**
 * 参加表明 UseCase。
 * - Schedule が CANCELLED なら拒否
 * - 定員チェック: isFull なら拒否（→ キャンセル待ちへ誘導）
 * - 既存 ATTENDING 参加があれば拒否
 * - 既存 CANCELLED 参加があれば再参加（reattend）
 */
export class AttendScheduleUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<AttendScheduleTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
        isVisitor?: boolean
        paymentMethod?: string | null
    }): Promise<{ participationId: string }> {
        let participationId = ''

        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            if (schedule.isCancelled()) {
                throw new ParticipationError('キャンセルされたスケジュールには参加できません', 'SCHEDULE_CANCELLED')
            }

            // 定員チェック
            const attendingCount = await repos.participation.countAttending(input.scheduleId)
            if (schedule.isFull(attendingCount)) {
                throw new ParticipationError('定員に達しています。キャンセル待ちに登録してください', 'SCHEDULE_FULL')
            }

            // 既存参加チェック
            const existing = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.userId
            )

            if (existing) {
                if (existing.isAttending()) {
                    throw new ParticipationError('すでに参加表明済みです', 'ALREADY_ATTENDING')
                }
                // CANCELLED → 再参加
                existing.reattend()
                await repos.participation.save(existing)
                participationId = existing.getId()
                return
            }

            // 新規参加
            const id = this.idGenerator.generate()
            const participation = Participation.create({
                id,
                scheduleId: ScheduleId.create(input.scheduleId),
                userId: UserId.create(input.userId),
                isVisitor: input.isVisitor,
                paymentMethod: input.paymentMethod ? PaymentMethod.create(input.paymentMethod) : null,
            })
            await repos.participation.save(participation)
            participationId = id
        })

        return { participationId }
    }
}
