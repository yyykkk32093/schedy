import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { WaitlistAuditLog } from '@/domains/activity/schedule/waitlist/domain/model/entity/WaitlistAuditLog.js'
import type { IWaitlistAuditLogRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistAuditLogRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import { WaitlistError } from '../error/WaitlistError.js'

export type CancelWaitlistTxRepositories = {
    waitlist: IWaitlistEntryRepository
    waitlistAuditLog: IWaitlistAuditLogRepository
}

/**
 * キャンセル待ち辞退 UseCase（物理削除方式）。
 * - WaitlistEntry を物理削除し、AuditLog に CANCELLED を記録
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
            if (!entry) {
                throw new WaitlistError('キャンセル待ちエントリーが見つかりません', 'WAITLIST_NOT_FOUND')
            }

            // 物理削除
            await repos.waitlist.delete(input.scheduleId, input.userId)

            // AuditLog: CANCELLED
            await repos.waitlistAuditLog.save(new WaitlistAuditLog({
                scheduleId: input.scheduleId,
                userId: input.userId,
                action: 'CANCELLED',
            }))
        })
    }
}
