/**
 * Stripe Connect アカウントのステータス取得 UseCase
 *
 * Community の stripeAccountId を使って Stripe API からアカウント状態を取得する。
 */

import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IStripeService } from '@/integration/stripe/IStripeService.js'

interface Input {
    communityId: string
}

interface Output {
    hasAccount: boolean
    stripeAccountId: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
}

export class GetStripeConnectStatusUseCase {
    constructor(
        private readonly communityRepo: ICommunityRepository,
        private readonly stripeService: IStripeService,
    ) { }

    async execute(input: Input): Promise<Output> {
        const community = await this.communityRepo.findById(input.communityId)
        if (!community) {
            throw new Error(`Community not found: ${input.communityId}`)
        }

        const stripeAccountId = community.getStripeAccountId()

        if (!stripeAccountId) {
            return {
                hasAccount: false,
                stripeAccountId: null,
                chargesEnabled: false,
                payoutsEnabled: false,
                detailsSubmitted: false,
            }
        }

        const status = await this.stripeService.getAccountStatus(stripeAccountId)

        return {
            hasAccount: true,
            stripeAccountId,
            ...status,
        }
    }
}
