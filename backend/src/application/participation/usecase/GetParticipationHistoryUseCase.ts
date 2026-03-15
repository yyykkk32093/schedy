import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'

export interface GetParticipationHistoryInput {
    scheduleId: string
    userId: string
}

export interface ParticipationHistoryDto {
    hasPaidCancellation: boolean
    paymentMethod: string | null
    paymentStatus: string | null
    cancelledAt: string | null
}

export class GetParticipationHistoryUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: GetParticipationHistoryInput): Promise<ParticipationHistoryDto> {
        // PayPay の未解決支払いが存在するか（REPORTED / CONFIRMED / REFUND_PENDING）
        const hasUnresolved = await this.paymentRepository.existsUnresolvedPayment(
            input.scheduleId,
            input.userId,
            'PAYPAY',
        )

        if (!hasUnresolved) {
            return {
                hasPaidCancellation: false,
                paymentMethod: null,
                paymentStatus: null,
                cancelledAt: null,
            }
        }

        return {
            hasPaidCancellation: true,
            paymentMethod: 'PAYPAY',
            paymentStatus: null,
            cancelledAt: null,
        }
    }
}
