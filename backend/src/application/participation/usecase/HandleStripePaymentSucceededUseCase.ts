import { logger } from '@/_sharedTech/logger/logger.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'

export class HandleStripePaymentSucceededUseCase {
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
                '[StripeWebhook] payment_intent.succeeded: Payment が見つかりません',
            )
            return
        }

        payment.markPaymentConfirmedByStripe()
        await this.paymentRepository.update(payment)

        logger.info(
            { paymentIntentId: input.paymentIntentId, paymentId: payment.getId() },
            '[StripeWebhook] payment_intent.succeeded: 支払確認済み',
        )
    }
}
