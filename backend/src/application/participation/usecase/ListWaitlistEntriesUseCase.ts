import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export class ListWaitlistEntriesUseCase {
    constructor(
        private readonly waitlistEntryRepository: IWaitlistEntryRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: { scheduleId: string }): Promise<{
        entries: Array<{
            id: string
            userId: string
            displayName: string | null
            position: number
            status: string
            registeredAt: Date
        }>
    }> {
        const entries = await this.waitlistEntryRepository.findsByScheduleId(input.scheduleId)

        // WAITING のみフィルタ
        const waitingEntries = entries.filter((e) => e.isWaiting())

        // ユーザーIDを一括取得して displayName を解決
        const userIds = waitingEntries.map((e) => e.getUserId().getValue())
        const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null]))

        return {
            entries: waitingEntries
                .sort((a, b) => a.getPosition() - b.getPosition())
                .map((e) => ({
                    id: e.getId(),
                    userId: e.getUserId().getValue(),
                    displayName: userMap.get(e.getUserId().getValue()) ?? null,
                    position: e.getPosition(),
                    status: e.getStatus().getValue(),
                    registeredAt: e.getRegisteredAt(),
                })),
        }
    }
}
