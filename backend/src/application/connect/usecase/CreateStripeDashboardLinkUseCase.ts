/**
 * Stripe Express ダッシュボードログインリンク生成 UseCase
 *
 * chargesEnabled=true のアカウントに対して、Stripe Express Dashboard の
 * ログインリンクを生成する。
 */

import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IStripeService } from '@/integration/stripe/IStripeService.js'

interface Input {
    communityId: string
}

interface Output {
    dashboardUrl: string
}

export class CreateStripeDashboardLinkUseCase {
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
            throw new Error(`Community ${input.communityId} has no Stripe Connect account`)
        }

        const { url } = await this.stripeService.createLoginLink(stripeAccountId)

        return { dashboardUrl: url }
    }
}
