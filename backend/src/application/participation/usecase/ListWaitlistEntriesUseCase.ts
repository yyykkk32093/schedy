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
            registeredAt: Date
        }>
    }> {
        // 物理削除方式: レコード存在 = 全員 WAITING、順番は registeredAt 昇順（Repo が保証）
        const entries = await this.waitlistEntryRepository.findsByScheduleId(input.scheduleId)

        // ユーザーIDを一括取得して displayName を解決
        const userIds = entries.map((e) => e.getUserId().getValue())
        const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null]))

        return {
            entries: entries.map((e) => ({
                id: e.getId(),
                userId: e.getUserId().getValue(),
                displayName: userMap.get(e.getUserId().getValue()) ?? null,
                registeredAt: e.getRegisteredAt(),
            })),
        }
    }
}
