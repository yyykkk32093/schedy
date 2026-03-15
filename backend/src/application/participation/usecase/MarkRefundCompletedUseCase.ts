import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

/**
 * MarkRefundCompletedUseCase — 管理者による返金完了マーク
 *
 * REFUND_PENDING → REFUNDED に遷移させる。
 * CASH / PayPay など手動返金の場合に管理者が使用する。
 */
export class MarkRefundCompletedUseCase {
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

        payment.markRefunded()
        await this.paymentRepository.update(payment)
    }
}
