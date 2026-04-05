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

        const userId = participation.getUserId()

        // userIdがある場合はscheduleId+userIdで検索、null（未登録ビジター）の場合はparticipationIdで検索
        const payment = userId
            ? await this.paymentRepository.findLatestByScheduleAndUser(
                participation.getScheduleId().getValue(),
                userId.getValue(),
            )
            : await this.paymentRepository.findByParticipationId(input.participationId)
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }

        payment.confirmPayment(input.confirmedBy)
        await this.paymentRepository.update(payment)
    }
}
