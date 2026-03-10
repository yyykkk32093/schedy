import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { WaitlistError } from '../error/WaitlistError.js'

export type CancelWaitlistTxRepositories = {
    waitlist: IWaitlistEntryRepository
}

/**
 * キャンセル待ち辞退 UseCase。
 */
export class CancelWaitlistUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<CancelWaitlistTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const entry = await repos.waitlist.findByScheduleAndUser(
                input.scheduleId, input.userId
            )
            if (!entry || !entry.isWaiting()) {
                throw new WaitlistError('キャンセル待ちエントリーが見つかりません', 'WAITLIST_NOT_FOUND')
            }

            entry.cancel()
            await repos.waitlist.save(entry)
        })
    }
}
