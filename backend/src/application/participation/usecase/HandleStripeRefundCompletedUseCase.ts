import { logger } from '@/_sharedTech/logger/logger.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'

export class HandleStripeRefundCompletedUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: {
        paymentIntentId: string
        metadata: Record<string, string>
    }): Promise<void> {
        const payment = await this.paymentRepository.findByStripePaymentIntentId(
            input.paymentIntentId,
        )

        if (!payment) {
            logger.warn(
                { paymentIntentId: input.paymentIntentId },
                '[StripeWebhook] charge.refunded: Payment が見つかりません',
            )
            return
        }

        payment.markRefunded()
        await this.paymentRepository.update(payment)

        logger.info(
            { paymentIntentId: input.paymentIntentId, paymentId: payment.getId() },
            '[StripeWebhook] charge.refunded: REFUNDED に更新',
        )
    }
}
