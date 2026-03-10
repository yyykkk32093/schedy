/**
 * GetWebhookConfigsUseCase — Webhook 設定一覧取得（UBL-29）
 *
 * OWNER / ADMIN のみ閲覧可能。
 */
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type {
    ICommunityWebhookConfigRepository,
    WebhookConfigDto,
} from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'

export class GetWebhookConfigsUseCase {
    constructor(
        private readonly webhookRepo: ICommunityWebhookConfigRepository,
        private readonly membershipRepo: ICommunityMembershipRepository,
    ) { }

    async execute(input: {
        communityId: string
        userId: string
    }): Promise<WebhookConfigDto[]> {
        const membership = await this.membershipRepo.findByCommunityAndUser(
            input.communityId, input.userId,
        )
        if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
            throw new Error('Webhook 設定の閲覧は OWNER または ADMIN のみです')
        }

        return this.webhookRepo.findByCommunityId(input.communityId)
    }
}
