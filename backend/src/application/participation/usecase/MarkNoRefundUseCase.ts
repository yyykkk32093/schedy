import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

/**
 * MarkNoRefundUseCase — 管理者による返金不要マーク
 *
 * REFUND_PENDING → NO_REFUND に遷移させる。
 * 管理者が返金しないと判断した場合に使用する。
 */
export class MarkNoRefundUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: { paymentId: string }): Promise<void> {
        const payment = await this.paymentRepository.findById(input.paymentId)
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }

        if (!payment.getPaymentStatus().isRefundPending()) {
            throw new ParticipationError('返金待ち状態ではありません', 'INVALID_PAYMENT_STATUS')
        }

        payment.markNoRefund()
        await this.paymentRepository.update(payment)
    }
}
