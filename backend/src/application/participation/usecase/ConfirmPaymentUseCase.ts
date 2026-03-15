import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export class ConfirmPaymentUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: {
        participationId: string
        confirmedBy: string
    }): Promise<void> {
        const participation = await this.participationRepository.findById(input.participationId)
        if (!participation) {
            throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
        }

        const payment = await this.paymentRepository.findLatestByScheduleAndUser(
            participation.getScheduleId().getValue(),
            participation.getUserId().getValue(),
        )
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }

        payment.confirmPayment(input.confirmedBy)
        await this.paymentRepository.update(payment)
    }
}
