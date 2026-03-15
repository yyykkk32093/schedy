import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export class ListParticipationsUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
        private readonly userRepository: IUserRepository,
        private readonly paymentRepository: IPaymentRepository,
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
        const [participations, payments] = await Promise.all([
            this.participationRepository.findsByScheduleId(input.scheduleId),
            this.paymentRepository.findsByScheduleId(input.scheduleId),
        ])

        // ユーザーごとに最新の Payment をマッピング
        const paymentMap = new Map<string, { method: string; status: string }>()
        for (const p of payments) {
            const userId = p.getUserId().getValue()
            if (!paymentMap.has(userId)) {
                paymentMap.set(userId, {
                    method: p.getPaymentMethod().getValue(),
                    status: p.getPaymentStatus().getValue(),
                })
            }
        }

        const userIds = participations.map((p) => p.getUserId().getValue())
        const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null]))

        return {
            participants: participations.map((p) => {
                const userId = p.getUserId().getValue()
                const pay = paymentMap.get(userId)
                return {
                    id: p.getId(),
                    userId,
                    displayName: userMap.get(userId) ?? null,
                    isVisitor: p.getIsVisitor(),
                    respondedAt: p.getRespondedAt(),
                    paymentMethod: pay?.method ?? null,
                    paymentStatus: pay?.status ?? null,
                }
            }),
        }
    }
}
