import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { Participation } from '@/domains/activity/schedule/participation/domain/model/entity/Participation.js'
import { ParticipationAuditLog } from '@/domains/activity/schedule/participation/domain/model/entity/ParticipationAuditLog.js'
import { PaymentMethod } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentMethod.js'
import type { IParticipationAuditLogRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationAuditLogRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type AttendScheduleTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    participationAuditLog: IParticipationAuditLogRepository
}

/**
 * 参加表明 UseCase（物理削除方式）。
 * - Schedule が CANCELLED なら拒否
 * - 定員チェック: isFull なら拒否（→ キャンセル待ちへ誘導）
 * - 既に参加レコードが存在すれば拒否（物理削除なのでレコード存在 = 参加中）
 * - 新規 Participation を作成し、AuditLog に JOINED を記録
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
            const attendingCount = await repos.participation.count(input.scheduleId)
            if (schedule.isFull(attendingCount)) {
                throw new ParticipationError('定員に達しています。キャンセル待ちに登録してください', 'SCHEDULE_FULL')
            }

            // 既存参加チェック（レコード存在 = 参加中）
            const existing = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (existing) {
                throw new ParticipationError('すでに参加表明済みです', 'ALREADY_ATTENDING')
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
            await repos.participation.add(participation)

            // AuditLog: JOINED
            await repos.participationAuditLog.save(new ParticipationAuditLog({
                scheduleId: input.scheduleId,
                userId: input.userId,
                action: 'JOINED',
                paymentMethod: participation.getPaymentMethod()?.getValue() ?? null,
                paymentStatus: participation.getPaymentStatus()?.getValue() ?? null,
            }))

            participationId = id
        })

        return { participationId }
    }
}
