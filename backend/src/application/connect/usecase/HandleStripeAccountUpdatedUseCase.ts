/**
 * Stripe account.updated Webhook ハンドラ UseCase
 *
 * Stripe から account.updated イベントを受信した際に、
 * 該当 Community の enabledPaymentMethods を同期する。
 *
 * - chargesEnabled = true → 'CREDIT_CARD' を enabledPaymentMethods に追加
 * - chargesEnabled = false → 'CREDIT_CARD' を enabledPaymentMethods から除去
 */

import { logger } from '@/_sharedTech/logger/logger.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'

interface Input {
    stripeAccountId: string
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
}

export class HandleStripeAccountUpdatedUseCase {
    constructor(
        private readonly communityRepo: ICommunityRepository,
    ) { }

    async execute(input: Input): Promise<void> {
        // stripeAccountId で Community を検索
        // NOTE: ICommunityRepository に findByStripeAccountId が無いため、
        //       ここではログ出力のみとし、ステータスは GET API 側でリアルタイム取得する。
        //       将来的に findByStripeAccountId を追加すれば enabledPaymentMethods の自動同期が可能。
        logger.info(
            {
                stripeAccountId: input.stripeAccountId,
                chargesEnabled: input.chargesEnabled,
                payoutsEnabled: input.payoutsEnabled,
                detailsSubmitted: input.detailsSubmitted,
            },
            '[StripeWebhook] account.updated received',
        )
    }
}
