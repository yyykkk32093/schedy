import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityNotFoundError } from '@/application/community/error/CommunityNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { Announcement } from '@/domains/announcement/domain/model/entity/Announcement.js'
import { AnnouncementContent } from '@/domains/announcement/domain/model/valueObject/AnnouncementContent.js'
import { AnnouncementId } from '@/domains/announcement/domain/model/valueObject/AnnouncementId.js'
import { AnnouncementTitle } from '@/domains/announcement/domain/model/valueObject/AnnouncementTitle.js'
import type { IAnnouncementRepository } from '@/domains/announcement/domain/repository/IAnnouncementRepository.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { ICommunityWebhookConfigRepository } from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { randomUUID } from 'crypto'
import { AnnouncementPermissionError } from '../error/AnnouncementPermissionError.js'

export type CreateAnnouncementTxRepositories = {
    announcement: IAnnouncementRepository
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

export class CreateAnnouncementUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateAnnouncementTxRepositories>,
        private readonly notificationService: NotificationService,
        private readonly webhookConfigRepo: ICommunityWebhookConfigRepository,
    ) { }

    async execute(input: {
        communityId: string
        title: string
        content: string
        userId: string
        attachments?: Array<{
            fileUrl: string
            fileName: string
            mimeType: string
            fileSize: number
        }>
    }): Promise<{ announcementId: string }> {
        let announcementId = ''

        await this.unitOfWork.run(async (repos) => {
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new AnnouncementPermissionError('お知らせの作成はOWNERまたはADMINのみ実行できます')
            }

            const id = AnnouncementId.create(this.idGenerator.generate())
            const announcement = Announcement.create({
                id,
                communityId: CommunityId.create(input.communityId),
                authorId: UserId.create(input.userId),
                title: AnnouncementTitle.create(input.title),
                content: AnnouncementContent.create(input.content),
            })

            await repos.announcement.save(announcement, input.attachments)
            announcementId = id.getValue()

            // コミュニティ全アクティブメンバーに ANNOUNCEMENT 通知（投稿者本人を除く）
            const allMembers = await repos.membership.findsByCommunityId(input.communityId)
            const recipients = allMembers.filter(
                (m) => m.isActive() && m.getUserId().getValue() !== input.userId,
            )
            for (const member of recipients) {
                await this.notificationService.prepareNotification(repos, {
                    userId: member.getUserId().getValue(),
                    type: 'ANNOUNCEMENT',
                    title: 'お知らせが投稿されました',
                    body: input.title,
                    referenceId: announcementId,
                    referenceType: 'ANNOUNCEMENT',
                })
            }

            // LINE Webhook 設定が有効な場合のみ OutboxEvent を保存（UBL-29）
            const lineConfig = await this.webhookConfigRepo.findByCommunityAndService(
                input.communityId, 'LINE',
            )
            if (lineConfig && lineConfig.enabled) {
                const webhookOutbox = new OutboxEvent({
                    outboxEventId: randomUUID(),
                    idempotencyKey: `webhook:announcement:${announcementId}`,
                    aggregateId: input.communityId,
                    eventName: 'AnnouncementCreated',
                    eventType: 'webhook.announcement',
                    routingKey: 'webhook.line',
                    payload: {
                        communityId: input.communityId,
                        type: 'ANNOUNCEMENT',
                        title: input.title,
                        body: input.content.length > 100 ? input.content.slice(0, 100) + '…' : input.content,
                    },
                    occurredAt: new Date(),
                })
                await repos.outbox.save(webhookOutbox)
            }
        })

        // TX commit 後に WS 配信
        this.notificationService.flush()

        return { announcementId }
    }
}
