import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

/**
 * RevertRefundStatusUseCase — 返金ステータスの巻き戻し
 *
 * REFUNDED / NO_REFUND → REFUND_PENDING に戻す。
 * 管理者が誤って返金済み・返金不要にした場合の訂正に使用する。
 */
export class RevertRefundStatusUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: { paymentId: string }): Promise<void> {
        const payment = await this.paymentRepository.findById(input.paymentId)
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }

        const ps = payment.getPaymentStatus()
        if (!ps.isRefunded() && !ps.isNoRefund()) {
            throw new ParticipationError('返金済みまたは返金不要状態ではありません', 'INVALID_PAYMENT_STATUS')
        }

        // REFUNDED / NO_REFUND → REFUND_PENDING に巻き戻す
        payment.revertToRefundPending()
        await this.paymentRepository.update(payment)
    }
}
