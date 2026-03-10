/**
 * UpsertWebhookConfigUseCase — Webhook 設定の作成/更新（UBL-29）
 *
 * OWNER / ADMIN のみ実行可能。
 * communityId + service で UPSERT（1コミュニティにつき1サービス1設定）。
 */
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { ICommunityWebhookConfigRepository } from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'
import { randomUUID } from 'crypto'

export class UpsertWebhookConfigUseCase {
    constructor(
        private readonly webhookRepo: ICommunityWebhookConfigRepository,
        private readonly membershipRepo: ICommunityMembershipRepository,
    ) { }

    async execute(input: {
        communityId: string
        service: string
        webhookUrl: string
        enabled: boolean
        userId: string
    }): Promise<{ id: string }> {
        // 権限チェック
        const membership = await this.membershipRepo.findByCommunityAndUser(
            input.communityId, input.userId,
        )
        if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
            throw new Error('Webhook 設定は OWNER または ADMIN のみ変更できます')
        }

        const existing = await this.webhookRepo.findByCommunityAndService(
            input.communityId, input.service,
        )
        const id = existing?.id ?? randomUUID()

        await this.webhookRepo.save({
            id,
            communityId: input.communityId,
            service: input.service.toUpperCase(),
            webhookUrl: input.webhookUrl,
            enabled: input.enabled,
            createdBy: input.userId,
        })

        return { id }
    }
}
