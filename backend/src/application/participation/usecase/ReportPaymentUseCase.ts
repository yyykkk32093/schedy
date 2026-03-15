import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export class ReportPaymentUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: {
        participationId: string
        userId: string
    }): Promise<void> {
        const participation = await this.participationRepository.findById(input.participationId)
        if (!participation) {
            throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
        }

        if (participation.getUserId().getValue() !== input.userId) {
            throw new ParticipationError('他のユーザーの支払報告はできません', 'FORBIDDEN')
        }

        const payment = await this.paymentRepository.findLatestByScheduleAndUser(
            participation.getScheduleId().getValue(),
            participation.getUserId().getValue(),
        )
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }

        payment.reportPayment()
        await this.paymentRepository.update(payment)
    }
}
