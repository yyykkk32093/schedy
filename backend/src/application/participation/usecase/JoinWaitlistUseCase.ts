import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { WaitlistEntry } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistEntry.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { WaitlistError } from '../error/WaitlistError.js'

export type JoinWaitlistTxRepositories = {
    schedule: IScheduleRepository
    participation: IParticipationRepository
    waitlist: IWaitlistEntryRepository
}

/**
 * キャンセル待ち登録 UseCase。
 * - Schedule が定員に達している場合のみ登録可（定員なし = 無条件参加なのでキャンセル待ち不要）
 * - 既に ATTENDING の参加がある場合は拒否
 * - 既に WAITING のエントリーがある場合は拒否
 */
export class JoinWaitlistUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<JoinWaitlistTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<{ waitlistEntryId: string }> {
        let waitlistEntryId = ''

        await this.unitOfWork.run(async (repos) => {
            const schedule = await repos.schedule.findById(input.scheduleId)
            if (!schedule) throw new ScheduleNotFoundError()

            if (schedule.isCancelled()) {
                throw new WaitlistError('キャンセルされたスケジュールにはキャンセル待ち登録できません', 'SCHEDULE_CANCELLED')
            }

            // 既に参加している場合は拒否
            const existingParticipation = await repos.participation.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (existingParticipation && existingParticipation.isAttending()) {
                throw new WaitlistError('すでに参加表明済みです', 'ALREADY_ATTENDING')
            }

            // 既にキャンセル待ちの場合は拒否
            const existingEntry = await repos.waitlist.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (existingEntry && existingEntry.isWaiting()) {
                throw new WaitlistError('すでにキャンセル待ち登録済みです', 'ALREADY_ON_WAITLIST')
            }

            // position 算出: WAITING の数 + 1
            const waitingCount = await repos.waitlist.countWaiting(input.scheduleId)
            const position = waitingCount + 1

            const id = this.idGenerator.generate()
            const entry = WaitlistEntry.create({
                id,
                scheduleId: ScheduleId.create(input.scheduleId),
                userId: UserId.create(input.userId),
                position,
            })
            await repos.waitlist.save(entry)
            waitlistEntryId = id
        })

        return { waitlistEntryId }
    }
}
