/**
 * DeleteWebhookConfigUseCase — Webhook 設定削除（UBL-29）
 *
 * OWNER / ADMIN のみ実行可能。
 */
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { ICommunityWebhookConfigRepository } from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'

export class DeleteWebhookConfigUseCase {
    constructor(
        private readonly webhookRepo: ICommunityWebhookConfigRepository,
        private readonly membershipRepo: ICommunityMembershipRepository,
    ) { }

    async execute(input: {
        communityId: string
        configId: string
        userId: string
    }): Promise<void> {
        const membership = await this.membershipRepo.findByCommunityAndUser(
            input.communityId, input.userId,
        )
        if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
            throw new Error('Webhook 設定の削除は OWNER または ADMIN のみです')
        }

        await this.webhookRepo.remove(input.configId)
    }
}
