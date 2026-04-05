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
            userId: string | null
            displayName: string | null
            visitorName: string | null
            addedBy: string | null
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

        // participationId ベースで Payment をマッピング（ゲストビジター対応）
        const paymentByParticipationId = new Map<string, { method: string | null; status: string }>()
        // userId ベースのフォールバック（既存データ互換）
        const paymentByUserId = new Map<string, { method: string | null; status: string }>()
        for (const p of payments) {
            const participationId = p.getParticipationId()
            if (participationId && !paymentByParticipationId.has(participationId)) {
                paymentByParticipationId.set(participationId, {
                    method: p.getPaymentMethod()?.getValue() ?? null,
                    status: p.getPaymentStatus().getValue(),
                })
            }
            const userId = p.getUserId()?.getValue()
            if (userId && !paymentByUserId.has(userId)) {
                paymentByUserId.set(userId, {
                    method: p.getPaymentMethod()?.getValue() ?? null,
                    status: p.getPaymentStatus().getValue(),
                })
            }
        }

        // 登録済みユーザーの表示名を取得
        const userIds = participations
            .map((p) => p.getUserId()?.getValue())
            .filter((id): id is string => id != null)
        const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null]))

        return {
            participants: participations.map((p) => {
                const userId = p.getUserId()?.getValue() ?? null
                const participationId = p.getId()
                // participationId → userId の順でPaymentを探す
                const pay = paymentByParticipationId.get(participationId) ??
                    (userId ? paymentByUserId.get(userId) : undefined)
                return {
                    id: participationId,
                    userId,
                    displayName: userId ? (userMap.get(userId) ?? null) : null,
                    visitorName: p.getVisitorName(),
                    addedBy: p.getAddedBy(),
                    isVisitor: p.getIsVisitor(),
                    respondedAt: p.getRespondedAt(),
                    paymentMethod: pay?.method ?? null,
                    paymentStatus: pay?.status ?? null,
                }
            }),
        }
    }
}
