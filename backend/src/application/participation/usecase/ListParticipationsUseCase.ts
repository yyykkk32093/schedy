import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export class ListParticipationsUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: { scheduleId: string }): Promise<{
        participants: Array<{
            id: string
            userId: string
            displayName: string | null
            isVisitor: boolean
            respondedAt: Date
            paymentMethod: string | null
            paymentStatus: string | null
        }>
    }> {
        // 物理削除方式: レコード存在 = 全員 ATTENDING
        const participations = await this.participationRepository.findsByScheduleId(input.scheduleId)

        // ユーザーIDを一括取得して displayName を解決
        const userIds = participations.map((p) => p.getUserId().getValue())
        const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null]))

        return {
            participants: participations.map((p) => ({
                id: p.getId(),
                userId: p.getUserId().getValue(),
                displayName: userMap.get(p.getUserId().getValue()) ?? null,
                isVisitor: p.getIsVisitor(),
                respondedAt: p.getRespondedAt(),
                paymentMethod: p.getPaymentMethod()?.getValue() ?? null,
                paymentStatus: p.getPaymentStatus()?.getValue() ?? null,
            })),
        }
    }
}
