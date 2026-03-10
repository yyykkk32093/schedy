import { prisma } from '@/_sharedTech/db/client.js'
import type {
    ICommunityWebhookConfigRepository,
    WebhookConfigDto,
} from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'

/**
 * CommunityWebhookConfigRepositoryImpl — Prisma 実装（UBL-29）
 */
export class CommunityWebhookConfigRepositoryImpl implements ICommunityWebhookConfigRepository {

    async findByCommunityId(communityId: string): Promise<WebhookConfigDto[]> {
        return prisma.communityWebhookConfig.findMany({
            where: { communityId },
            orderBy: { createdAt: 'asc' },
        })
    }

    async findByCommunityAndService(communityId: string, service: string): Promise<WebhookConfigDto | null> {
        return prisma.communityWebhookConfig.findUnique({
            where: {
                communityId_service: { communityId, service },
            },
        })
    }

    async save(config: {
        id: string
        communityId: string
        service: string
        webhookUrl: string
        enabled: boolean
        createdBy: string
    }): Promise<void> {
        await prisma.communityWebhookConfig.upsert({
            where: {
                communityId_service: {
                    communityId: config.communityId,
                    service: config.service,
                },
            },
            create: config,
            update: {
                webhookUrl: config.webhookUrl,
                enabled: config.enabled,
            },
        })
    }

    async update(id: string, data: { webhookUrl?: string; enabled?: boolean }): Promise<void> {
        await prisma.communityWebhookConfig.update({
            where: { id },
            data,
        })
    }

    async remove(id: string): Promise<void> {
        await prisma.communityWebhookConfig.delete({
            where: { id },
        })
    }
}
